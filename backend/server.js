require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());


// ------------------------------ Google AI Code HERE ------------------------------ //



// ------------------------------ Google AI Code HERE ------------------------------ //

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
