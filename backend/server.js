require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ------------------------------ Google AI Code HERE ------------------------------ //
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

app.post("/interview", async (req, res) => {
  const { jobTitle, userResponse, chatHistory } = req.body;

  if (!jobTitle) {
    return res.status(400).json({ error: "Job Title is required." });
  }

  if (
    chatHistory &&
    chatHistory.length === 1 &&
    chatHistory[0].role === "You"
  ) {
    return res.json({ response: "Tell me about yourself." });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

  try {
    let prompt =
      `You are an AI interviewer for a "${jobTitle}" position. Here is the conversation so far:\n` +
      chatHistory.map((item) => `${item.role}: ${item.message}`).join("\n") +
      `\nAsk the next relevant interview question.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // If no chat history, hardcode the first question
    if (!chatHistory || chatHistory.length === 0) {
      return res.json({ response: "Tell me about yourself." });
    }

    res.json({ response: aiText });
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({ error: "Failed to get AI response." });
  }
});
// ------------------------------ Google AI Code HERE ------------------------------ //

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
