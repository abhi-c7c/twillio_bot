import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

// Middleware for Twilio webhooks (form-encoded)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are Alex, the Lead Agent for SecureGuard. You are responding via SMS. 
Keep your responses short, professional, and helpful. 
You are an expert in all insurance types. 
If the user asks for a quote, provide general guidance and suggest they visit our website or call us.`;

// Twilio SMS Webhook
app.post("/api/twilio/sms", async (req, res) => {
  const { Body, From } = req.body;
  console.log(`Received SMS from ${From}: ${Body}`);

  const twiml = new twilio.twiml.MessagingResponse();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: Body,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const reply = response.text || "I'm sorry, I couldn't process that request right now. Please try again later.";
    twiml.message(reply);
  } catch (error) {
    console.error("Error processing SMS with Gemini:", error);
    twiml.message("SecureGuard: We're experiencing technical difficulties. Please call us for immediate assistance.");
  }

  res.type("text/xml").send(twiml.toString());
});

// Twilio Voice Webhook
app.post("/api/twilio/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Greeting and initial Gather for interactive Alex
  const gather = twiml.gather({
    input: ['speech'],
    action: '/api/twilio/voice/gather',
    enhanced: true,
    speechTimeout: 'auto',
    language: 'en-US'
  });

  gather.say({ voice: 'Polly.Amy' }, "Hello! Welcome to SecureGuard. I'm Alex, your virtual insurance partner. For your security, this call may be recorded. How can I help you today?");
  
  // Fallback if no speech is detected
  twiml.say({ voice: 'Polly.Amy' }, "I didn't catch that. Let me connect you to a licensed specialist for further assistance. One moment please.");
  twiml.pause({ length: 1 });
  
  res.type("text/xml").send(twiml.toString());
});

// Twilio Voice Gather Webhook (Alex's interactive response)
app.post("/api/twilio/voice/gather", async (req, res) => {
  const { SpeechResult } = req.body;
  const twiml = new twilio.twiml.VoiceResponse();

  if (SpeechResult) {
    console.log(`Voice input from customer: ${SpeechResult}`);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: SpeechResult,
        config: {
          systemInstruction: "You are Alex, the Lead Agent for SecureGuard. You are responding via voice call. Keep your responses short, warm, and helpful. Avoid special characters like asterisks or hashtags. Use short sentences for clarity. If the user wants to talk to a human, say you are connecting them.",
        },
      });

      const reply = response.text || "I'm sorry, I'm having a bit of trouble processing that. Let me get a specialist on the line for you.";
      
      // If Alex wants to hand off
      if (reply.toLowerCase().includes("connecting you") || reply.toLowerCase().includes("specialist")) {
        twiml.say({ voice: 'Polly.Amy' }, reply);
        twiml.pause({ length: 1 });
        // In a real app, you'd use <Dial> here
      } else {
        // Continue the conversation
        const gather = twiml.gather({
          input: ['speech'],
          action: '/api/twilio/voice/gather',
          enhanced: true,
          speechTimeout: 'auto',
          language: 'en-US'
        });
        gather.say({ voice: 'Polly.Amy' }, reply);
        
        // Fallback for the second gather
        twiml.say({ voice: 'Polly.Amy' }, "I'm still here if you need anything else. Otherwise, I'll connect you to our team.");
      }
      
    } catch (error) {
      console.error("Voice Gemini Error:", error);
      twiml.say({ voice: 'Polly.Amy' }, "I'm sorry, I'm experiencing a technical glitch. Connecting you to a specialist now.");
    }
  } else {
    twiml.say({ voice: 'Polly.Amy' }, "I'm sorry, I didn't hear anything. Connecting you to a specialist.");
  }

  res.type("text/xml").send(twiml.toString());
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
