const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// 1. Register the Schema for the live server
const KnowledgeSchema = new mongoose.Schema({
    question: String,
    answer: String,
    context: String,
    embedding: [Number]
});

// Safely check if it already exists to prevent overwrite errors
const Knowledge = mongoose.models.Knowledge || mongoose.model('Knowledge', KnowledgeSchema);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

// Helper Function: Cosine Similarity Math
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function retrieveContext(userQuery) {
    const Knowledge = mongoose.model('Knowledge');
    let combinedContext = "Here is information from the database:\n";
    
    // 1. Always grab the fast Keyword results first
    const keywordResults = await Knowledge.find(
        { $text: { $search: userQuery } },
        { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }).limit(3);

    keywordResults.forEach(doc => combinedContext += `- ${doc.context}\n`);

    try {
        // 2. Attempt Vector Search safely
        const queryEmbeddingResult = await embeddingModel.embedContent(userQuery);
        const queryVector = queryEmbeddingResult.embedding.values;
        
        // Limit documents fetched to reduce in-memory CPU latency on Render free tier
        const sampleDocs = await Knowledge.find({}).limit(200); 
        
        let vectorResults = sampleDocs.map(doc => {
            return {
                document: doc,
                similarity: cosineSimilarity(queryVector, doc.embedding)
            };
        });
        
        vectorResults.sort((a, b) => b.similarity - a.similarity);
        const topVectorDocs = vectorResults.slice(0, 2).map(item => item.document);
        
        topVectorDocs.forEach(doc => combinedContext += `- ${doc.context}\n`);
        console.log("Hybrid Search: Vector components integrated successfully.");
    } catch (error) {
        console.warn("Embedding API Quota limit hit. Falling back smoothly to pure Keyword Search strategy.");
    }

    return combinedContext;
}

module.exports = { retrieveContext };
