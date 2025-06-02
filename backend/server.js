require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ------------------------------ Google AI Code HERE ------------------------------ //
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.post("/interview", async (req, res) => {
  const { jobTitle, userResponse, chatHistory } = req.body;

  try {
    console.log("Received data:", { jobTitle, userResponse, chatHistory });

    const filteredHistory = chatHistory
      .filter((item) => item.message && item.message.trim() !== "")
      .map((item) => ({
        role: item.role.toLowerCase() === "user" ? "user" : "model",
        parts: [{ text: item.message }],
      }));

    // Inject system prompt at the start
    const systemPrompt = {
      role: "user",
      parts: [
        {
          text: `You are acting as a job interviewer for the role of ${jobTitle}.
          Your tasks:
          - Start with “Tell me about yourself.”
          - Ask at least 6 thoughtful, relevant questions based on the user's responses.
          - Do NOT hardcode any other questions.
          - Ensure all questions relate to the job of ${jobTitle}.
          - After 6 questions, ask if the interviewee would like to proceed if yes continue asking question if no, provide a detailed evaluation and suggestions for improvement.`,
        },
      ],
    };

    const fullHistory = [systemPrompt, ...filteredHistory];

    const chat = model.startChat({ history: fullHistory });

    const messageToSend =
      userResponse && userResponse.trim() !== ""
        ? userResponse
        : `I am applying for the role of ${jobTitle}. Tell me about yourself.`;

    const result = await chat.sendMessage(messageToSend);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to get response from Gemini API." });
  }
});

// ------------------------------ Google AI Code HERE ------------------------------ //

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
