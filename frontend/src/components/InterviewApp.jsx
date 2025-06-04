import { useState } from "react";
import axios from "axios";
import Styles from './InterviewApp.module.css'


export default function App() {
  const [jobTitle, setJobTitle] = useState("");
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const handleSubmit = async () => {
    const updatedHistory = [
      ...chatHistory,
      { role: "You", message: userInput },
    ];

    try {
      const response = await axios.post("http://localhost:3000/interview", {
        jobTitle,
        userResponse: userInput,
        chatHistory: updatedHistory,
      });
      
      const rawAI = response.data.response;
      const cleanedAI = rawAI.replace(/^Interviewer:\s*/i, "");

      setChatHistory([
        ...updatedHistory,
        { role: "Interviewer", message: cleanedAI },
      ]);
      setUserInput("");
    } catch (error) {
      console.error("Error from server:", error);
    }
  };

  return (
    <div className={Styles.AiContainer}>

      <h1 className={Styles.Heading}>Turners AI Interviewer</h1>

      <h3 className={Styles.GetStartedHeading}>To get started let us know the position you are interviewing for</h3>

     <input
        type="text"
        placeholder="Enter Job Title"
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        className={Styles.JobTitle}
      />


      <div className={Styles.Response}>
        {chatHistory.map((item, index) => (
          <div key={index}>
            <strong>{item.role}:</strong> {item.message}
          </div>
        ))}
      </div>

      <textarea
        rows="3"
        placeholder="Type your answer here..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        className={Styles.InputBox}
      />

      <button
        onClick={handleSubmit}
        className={Styles.Button}
      >
        Submit
      </button>
    </div>
  );
}
