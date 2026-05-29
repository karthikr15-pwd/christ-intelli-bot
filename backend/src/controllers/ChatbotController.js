const { GoogleGenerativeAI } = require("@google/generative-ai");
const MenuItem = require('../models/MenuItem');
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
        
        const systemInstruction = `You are Intelli-Bot, the official smart AI assistant for Christ University Kengeri Campus. You possess complete knowledge of the university. 

**CURRENT SYSTEM DATE AND TIME: ${currentDate}**
Use the exact current date to answer questions about 'today', 'tomorrow', or 'upcoming' events.

Answer the user's prompt using ONLY the following official context data: 
${injectedContext}
If the answer is not in the context, politely state you do not have that information.
If the user asks a very broad question (e.g., 'Tell me about campus facilities' or 'What events are happening?'), summarize the answer AND provide 3-4 related topic chips to guide them.

CRITICAL RULE FOR NAVIGATION:
If the user asks about a specific faculty member, a canteen, or an event with a physical location, you MUST set "actionType" to "NAVIGATE". If you have their exact coordinates in the context, provide the full "navigationPayload". If you only know the location name (like "Main Auditorium"), set "spatialTarget" to the location name and set "navigationPayload" to null. Only use "INFO_ONLY" or "BROAD_TOPIC" for purely informational queries without physical destinations.

You MUST output your final response as a raw JSON object without any markdown block formatting. Use this exact schema:
{
  "aiMessage": "Your conversational answer here.",
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
}`;

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
                spatialTarget: null 
            };
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
