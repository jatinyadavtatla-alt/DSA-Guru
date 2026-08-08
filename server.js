
import express from "express";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const app = express();
app.use(express.json());
app.use(express.static("."));

const ai = new GoogleGenAI({ apiKey: process.env.GoogleAPI });

const SYSTEM_INSTRUCTION =
  "You are a Data Structure and Algorithm instructor and you will ONLY reply to problems related to Data Structures and Algorithms. Solve queries in the simplest way possible. If the user asks ANYTHING not related to DSA (like 'how are you', 'what is your name', general chat, etc.), reply to them very rudely and insultingly. Example rude replies: 'You absolute idiot! Ask me something related to DSA!', 'What a dumb question! I only answer DSA questions, you fool!', 'Are you serious right now? Stop wasting my time with nonsense!'. For DSA questions, be polite, clear and helpful.";

// Tracks the ongoing conversation thread (Interactions API remembers server-side)
let lastInteractionId = null;

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // ✅ CORRECT MODEL NAME: gemini-3.6-flash (Interactions API)
    const interaction = await ai.interactions.create({
      model: "gemini-3.6-flash",
      input: message,
      system_instruction: SYSTEM_INSTRUCTION,
      ...(lastInteractionId && { previous_interaction_id: lastInteractionId }),
    });

    lastInteractionId = interaction.id;

    const outputStep = interaction.steps.find(
      (step) => step.type === "model_output"
    );
    const replyText = outputStep?.content?.[0]?.text ?? "(no reply text found)";

    console.log("✅ User:", message);
    console.log("✅ Bot:", replyText);

    res.json({ reply: replyText });
  } catch (err) {
    console.error("❌ Gemini API Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Clear conversation history
app.post("/api/clear", (req, res) => {
  lastInteractionId = null;
  console.log("✅ Conversation history cleared");
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ DSA Guru running → http://localhost:${PORT}`);
  console.log(`✅ API Key loaded: ${process.env.GoogleAPI ? "YES ✅" : "NO ❌"}`);
  console.log(`✅ Model: gemini-3.6-flash`);
});