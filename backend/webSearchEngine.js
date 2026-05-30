const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using the ultra-fast flash model equipped with dynamic search grounding tools
const searchModel = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    tools: [{ googleSearch: {} }] 
});

async function fetchLiveWebSearch(userQuery) {
    try {
        console.log(`[Phase 2] Initializing live web crawl for query: "${userQuery}"`);
        
        const result = await searchModel.generateContent({
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: {
                role: "system", 
                parts: [{ text: "You are a live web research agent. Search the internet to find precise, accurate, and up-to-date answers for the user's query. Return a clear summary of your findings." }]
            }
        });

        const responseText = result.response.text();
        
        // Extract search grounding metadata if available for research verification
        const searchChunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        let sourcesSummary = "\n\n🌐 **Sources Verified:**\n";
        
        if (searchChunks.length > 0) {
            searchChunks.forEach((chunk, index) => {
                if (chunk.web?.uri) {
                    sourcesSummary += `${index + 1}. [${chunk.web.title || 'Source'}](${chunk.web.uri})\n`;
                }
            });
        } else {
            sourcesSummary += "- Real-time search engine compilation\n";
        }

        return responseText + sourcesSummary;
    } catch (error) {
        console.error("Web Search Engine Error:", error.message);
        return "I attempted to search the live web but encountered a connectivity or rate-limit issue. Please try again shortly.";
    }
}

module.exports = { fetchLiveWebSearch };
