require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    try {
        console.log("API KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "You are a helpful assistant."
        });
        const result = await model.generateContent("Hello");
        console.log(result.response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
run();
