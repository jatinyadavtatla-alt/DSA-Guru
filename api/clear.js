import { state } from "../lib/interactionState.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  state.lastInteractionId = null;
  console.log("✅ Conversation history cleared");
  res.json({ success: true });
}