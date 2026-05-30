const { GoogleGenerativeAI } = require("@google/generative-ai");
const MenuItem = require('../models/MenuItem');
const { retrieveContext } = require('../../ragEngine');
const { fetchLiveWebSearch } = require('../../webSearchEngine');
const Canteen = require('../models/Canteen');
const Faculty = require('../models/Faculty');
const CampusInformation = require('../models/CampusInformation');

console.log("Chatbot Engine Loaded: LLM Integration (Deep RAG Architecture)");

const processMessage = async (req, res) => {
    try {
        const userMessage = req.body.message || '';
        
        if (!userMessage) {
            return res.status(400).json({ reply: "Please provide a message." });
        }

        // Fetch Live Context
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let menuItems, canteens, facultyMembers, campusInfoItems;
        try {
            [menuItems, canteens, facultyMembers, campusInfoItems] = await Promise.all([
                MenuItem.find({}).populate('canteenId', 'name'),
                Canteen.find({}),
                Faculty.find({}),
                CampusInformation.find({
                    $or: [
                        { expiryDate: { $gte: today } },
                        { expiryDate: { $exists: false } },
                        { expiryDate: null }
                    ]
                })
            ]);
        } catch (dbError) {
            console.error("Database Query Error:", dbError.message || dbError);
            return res.status(500).json({ 
                reply: { aiMessage: "Intelli-Bot is taking a quick break. Please try again in a moment!", actionType: "INFO_ONLY", spatialTarget: null }, 
                timestamp: new Date() 
            });
        }

        // Format the Context
        let injectedContext = "\n--- LIVE CAMPUS DATABASE CONTEXT ---\n";

        injectedContext += "\nCANTEENS & MENU ITEMS:\n";
        if (canteens.length > 0) {
            canteens.forEach(canteen => {
                injectedContext += `[${canteen.name}] (Hours: ${canteen.operatingHours}):\n`;
                const items = menuItems.filter(item => item.canteenId && item.canteenId._id.toString() === canteen._id.toString());
                if (items.length > 0) {
                    items.forEach(item => {
                        injectedContext += `  - ${item.name} (₹${item.price}) - ${item.category} - ${item.isVeg ? 'Veg' : 'Non-Veg'}\n`;
                    });
                } else {
                    injectedContext += "  - No items listed.\n";
                }
            });
        } else {
            injectedContext += "No canteens available right now.\n";
        }

        injectedContext += "\nFACULTY:\n";
        if (facultyMembers.length > 0) {
            facultyMembers.forEach(faculty => {
                const loc = `${faculty.blockName} | ${faculty.floorLevel} ` + 
                            (faculty.cabinNumber ? `| Cabin ${faculty.cabinNumber} ` : '') +
                            (faculty.staffroomNumber ? `| Staffroom ${faculty.staffroomNumber}` : '');
                injectedContext += `- ${faculty.fullName} (Dept: ${faculty.department}, Location: ${loc.trim()}, Coordinates: [${faculty.latitude}, ${faculty.longitude}], Timings: ${faculty.timings})\n`;
            });
        } else {
            injectedContext += "No faculty information available.\n";
        }

        injectedContext += "\nCAMPUS INFORMATION (ACADEMICS, EVENTS, IT, INFRASTRUCTURE, EMERGENCY):\n";
        if (campusInfoItems.length > 0) {
            campusInfoItems.forEach(info => {
                injectedContext += `[${info.category} - ${info.subCategory}] ${info.title}: ${info.contentDetails}\n\n`;
            });
        }

        injectedContext += "------------------------------------\n";

        const currentDate = new Date().toLocaleString();
        
        const ragContext = await retrieveContext(userMessage);
        
        const systemInstruction = `You are an intelligent campus assistant. Evaluate the provided database context against the user's query.

**CURRENT SYSTEM DATE AND TIME: ${currentDate}**
Use the exact current date to answer questions about 'today', 'tomorrow', or 'upcoming' events.

Use the following retrieved database context to inform your answer. If the context is relevant, rely on it heavily: 
${ragContext}

Answer the user's prompt using ONLY the following official context data: 
${injectedContext}

CRITICAL RULE FOR NAVIGATION:
If the user asks about a specific faculty member, a canteen, or an event with a physical location, you MUST set "actionType" to "NAVIGATE". If you have their exact coordinates in the context, provide the full "navigationPayload". If you only know the location name (like "Main Auditorium"), set "spatialTarget" to the location name and set "navigationPayload" to null. Only use "INFO_ONLY" or "BROAD_TOPIC" for purely informational queries without physical destinations.

You MUST output your response in this exact JSON structure:
{
  "requiresWebSearch": boolean,
  "aiMessage": "Your answer",
  "actionType": "INFO_ONLY" | "NAVIGATE" | "BROAD_TOPIC",
  "spatialTarget": "Exact Name of the building/room if actionType is NAVIGATE, otherwise null",
  "suggestedChips": ["String Array", "Max 4 items", "Only if BROAD_TOPIC, else empty"],
  "navigationPayload": {
    "name": "Target Name",
    "blockName": "Block Name",
    "floorLevel": "Floor Level",
    "cabinNumber": "Cabin Number",
    "latitude": 12.86,
    "longitude": 77.43
  } // (Set to null if actionType is INFO_ONLY or BROAD_TOPIC)
}

- If the provided context fully answers the question, set requiresWebSearch to false and write your answer in aiMessage.
- If the context does NOT contain the answer, or the user is asking for real-time/outside information, set requiresWebSearch to true and leave aiMessage empty.`;

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction 
        });

        const result = await model.generateContent(userMessage);
        let botResponseText = result.response.text();
        
        // Clean markdown backticks if Gemini accidentally adds them
        if (botResponseText.startsWith('\`\`\`json')) {
            botResponseText = botResponseText.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (botResponseText.startsWith('\`\`\`')) {
            botResponseText = botResponseText.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        let parsedJson;
        try {
            parsedJson = JSON.parse(botResponseText);
        } catch (parseError) {
            console.error("JSON Parse Error. Raw output was:", botResponseText);
            parsedJson = { 
                aiMessage: "I experienced a cognitive error processing the data. Please rephrase.", 
                actionType: "INFO_ONLY", 
                spatialTarget: null,
                requiresWebSearch: false
            };
        }

        // The Agentic Router Logic
        if (parsedJson.requiresWebSearch === true) {
            console.log("[Router] Local context insufficient. Triggering Live Web Search...");
            const liveWebData = await fetchLiveWebSearch(userMessage);
            parsedJson.aiMessage = liveWebData; 
        }

        // IMPORTANT: We return the parsed JSON inside 'reply' because mobile_app ApiService.chat expects response['reply']
        // However, we want to return the whole json structure, so we just set reply to the whole parsed object or a string.
        // Actually, returning it as { reply: parsedJson.aiMessage, ...parsedJson } is safest to not break existing apps completely if they just read .reply.
        return res.status(200).json({ 
            reply: parsedJson.aiMessage,
            actionType: parsedJson.actionType,
            spatialTarget: parsedJson.spatialTarget,
            navigationPayload: parsedJson.navigationPayload,
            suggestedChips: parsedJson.suggestedChips,
            timestamp: new Date() 
        });

    } catch (error) {
        console.error("Gemini API Error Details:", error.message || error);
        return res.status(500).json({ 
            reply: "Intelli-Bot is taking a quick break. Please try again in a moment!",
            actionType: "INFO_ONLY",
            spatialTarget: null
        });
    }
};

module.exports = {
    processMessage
};
