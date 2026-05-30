import fs from 'fs';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGO_URI);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const KnowledgeSchema = new mongoose.Schema({
    question: String,
    answer: String,
    context: String,
    embedding: [Number]
});
const Knowledge = mongoose.model('Knowledge', KnowledgeSchema);

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedDatabase() {
    console.log("Loading SQuAD 2.0 Dataset into memory...");
    const rawData = fs.readFileSync('./dataset/squad.json', 'utf8');
    const squadData = JSON.parse(rawData);

    let count = 0;
    const MAX_RECORDS = 2000;

    console.log("Starting Vector Generation Engine...");

    for (const article of squadData.data) {
        for (const paragraph of article.paragraphs) {
            for (const qa of paragraph.qas) {
                if (qa.is_impossible || qa.answers.length === 0) continue;
                if (count >= MAX_RECORDS) {
                    console.log(`\n🎉 Success! Ingested ${MAX_RECORDS} records for the research database.`);
                    process.exit(0);
                }

                try {
                    const contextText = paragraph.context;
                    const questionText = qa.question;
                    const answerText = qa.answers[0].text;

                    const result = await embeddingModel.embedContent(contextText);
                    const vector = result.embedding.values;

                    await Knowledge.create({
                        question: questionText,
                        answer: answerText,
                        context: contextText,
                        embedding: vector
                    });

                    count++;
                    console.log(`[${count}/${MAX_RECORDS}] Embedded & Saved: "${questionText.substring(0, 40)}..."`);

                    await delay(2000); 

                } catch (error) {
                    console.error("API Error (Probably hit rate limit). Retrying in 10 seconds...", error.message);
                    await delay(10000); 
                }
            }
        }
    }
}

seedDatabase();
