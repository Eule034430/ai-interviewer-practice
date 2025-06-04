// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/interview", async (req, res) => {
  const { jobTitle, userResponse, chatHistory } = req.body;

  // ─── 1) If there's no history (first call), ask greeting ─────────────────────────
  if (
    !chatHistory ||
    chatHistory.length === 0 ||
    chatHistory.every((item) => !item.message.trim())
  ) {
    return res.json({
      response: "Hello, tell me about yourself.",
    });
  }

  // ─── 2) Format the existing history into a single string ─────────────────────────
  //     Each entry in chatHistory is expected to look like: { role: "You"|"Interviewer", message: "..." }
  const formattedHistory = chatHistory
    .map((entry) => `${entry.role}: ${entry.message}`)
    .join("\n");

  // ─── 3) Count how many questions the interviewer has already asked ─────────────────
  //     We assume each time AI asks something, you push { role: "Interviewer", message: "..." }
  //     into chatHistory on the frontend. So count those.
  const numInterviewerQuestions = chatHistory.filter(
    (entry) => entry.role === "Interviewer"
  ).length;

  let prompt;

  // ─── 4) If fewer than 6 interviews have been asked so far, ask the (N+1)th question ───
  if (numInterviewerQuestions < 6) {
    // Build a prompt that tells Gemini: “Based on the conversation, ask the next question (you’ve asked N so far)”
    prompt = `
  You are a job interviewer for the position: "${jobTitle}". 
  So far, you have asked ${numInterviewerQuestions} question${
      numInterviewerQuestions === 1 ? "" : "s"
    }. 
  Now ask question #${numInterviewerQuestions + 1} (out of 6) to the candidate. 
  Be sure each question is relevant to the "${jobTitle}" role and does not repeat any previous questions.

  Conversation so far:
  ${formattedHistory}
  You: ${userResponse}

  (Remember: Ask only one question at a time. After the user responds, your next call to this endpoint will handle #${
    numInterviewerQuestions + 2
  }, etc.)
  `;
  }
  // ─── 5) If exactly 6 questions have already been asked, switch to feedback mode ─────────
  else {
    // At this point, the candidate has already answered 6 questions.
    // We want Gemini to produce feedback on all six answers.
    prompt = `
  You are the interviewer for the "${jobTitle}" role. 
  You have completed a 6‐question interview with the candidate. 
  Now provide **brief and concise** feedback on how well the candidate answered each of the six questions—highlight only the key strengths and one or two areas for improvement.

  Here is the full conversation transcript:
  ${formattedHistory}
  You: ${userResponse}

  (Provide your overall feedback now; do not ask any more questions.)
  `;
  }

  // ─── 6) Send the prompt to Google Gemini, receive AI’s reply, and return it ────────────
  try {
    // Note: generateContent takes either a single string or an array of strings.
    const result = await model.generateContent(prompt);
    const reply = result.response.text();
    res.json({ response: reply.trim() });
  } catch (error) {
    console.error("Gemini error:", error);
    res.status(500).json({ error: "Failed to generate interview question." });
  }
});

// ─── 7) Start the server, listening on the PORT from .env ──────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
