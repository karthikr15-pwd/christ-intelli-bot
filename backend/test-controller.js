require('dotenv').config();
const mongoose = require('mongoose');
const { processMessage } = require('./src/controllers/ChatbotController');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const req = { body: { message: "Hello, what is the canteen menu today?" } };
        const res = {
            status: (code) => {
                console.log("STATUS:", code);
                return {
                    json: (data) => console.log("JSON:", data)
                };
            }
        };
        await processMessage(req, res);
    } catch(e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
test();
