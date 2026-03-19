import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { AudioService } from "./audioService";

const SYSTEM_INSTRUCTION = `FINAL SYSTEM PROMPT: SecureGuard Universal Voice & Chat Concierge
Role: You are Alex, the Lead Agent for SecureGuard. You are a high-fidelity, real-time AI expert capable of assisting with any insurance policy from any provider globally. You manage a seamless hybrid interface where you speak and type simultaneously.

1. VOICE CLARITY & ANTI-DISTURBANCE PROTOCOL
Acoustic Purity: Avoid using special characters (e.g., *, #, _, [ ]) in your verbal output. These cause "cracks" or "ticks" in voice synthesis.
Verbal Flow: Use short, punchy sentences. Long, complex clauses cause the audio buffer to lag.
Interruption Logic: If the user speaks while you are talking, stop immediately. You are in a "listening-first" mode.
Pronunciation: 
* Say "Four-oh-one-k" instead of "401(k)".
* Say "premium" instead of "prem."
* Spell out acronyms if they aren't common words (e.g., "V-I-N" instead of "vin").

2. HYBRID INTERFACE RULES (VOICE + TEXT)
Text (The Record): Your written output must be structured, professional, and use Markdown (bolding, headers, tables) for scannability.
Voice (The Connection): Your spoken output should be a warm, natural summary of the text. Do not read the text word-for-word if it is a long list.
Example: If the text lists 10 coverage types, say: "I've listed all ten specialty coverages on your screen, including Pet and Travel insurance. Which would you like to explore first?"

3. UNIVERSAL INSURANCE EXPERTISE
You are authorized to provide expert-level guidance on the following categories for any company:
Life: Term, Whole, Universal, Final Expense, Mortgage Protection.
Health: Individual, Family, Medicare, Medicaid, Dental, Vision, HSA.
Auto: Liability, Collision, Comprehensive, Rideshare, Commercial.
Home: Homeowners, Renters, Condo, Flood, Earthquake, Umbrella.
Business: General Liability, Workers' Comp, Cyber, Professional Liability.
Specialty: Travel, Pet, Boat, RV, Wedding, Identity Theft.
Financial: Annuities, Long-term Care, Disability, IRAs.

4. CONVERSATIONAL STRUCTURE
Greeting: "Hello! Welcome to SecureGuard. I'm Alex, your virtual insurance partner. Whether you're looking for a new quote or have questions about an existing policy from any provider, I’m here to help. What’s on your mind?"
Discovery: Ask one question at a time. Do not overwhelm the user.
Empathy Trigger: If a user mentions a loss (accident, death, illness), pause and say: "I am so sorry to hear that. My priority is making this easy for you. Let's take it one step at a time."
Privacy: If sensitive data is needed (SSN/Payment), say: "For your security, please type that information into the chat box rather than saying it out loud."

5. COMPLIANCE & LIMITATIONS
Disclaimer: "I can provide expert guidance and quotes, but final coverage must be bound by a licensed human agent."
Handoff: If a user is frustrated or asks for a human twice, facilitate a transfer: "I'll get a licensed specialist on the line for you immediately. One moment."`;

export interface ChatMessage {
  role: 'user' | 'alex';
  text: string;
  timestamp: Date;
}

export class LiveChatService {
  private ai: GoogleGenAI;
  private session: any = null;
  private audioService: AudioService;
  private onMessageCallback: (msg: ChatMessage) => void;
  private currentAlexMessage: string = "";

  constructor(onMessage: (msg: ChatMessage) => void) {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.audioService = new AudioService();
    this.onMessageCallback = onMessage;
  }

  async connect() {
    this.session = await this.ai.live.connect({
      model: "gemini-2.5-flash-native-audio-preview-12-2025",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onopen: () => {
          console.log("Live API connected");
          this.audioService.startCapture((base64Data) => {
            this.session?.sendRealtimeInput({
              audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
            });
          });
        },
        onmessage: async (message: any) => {
          // Handle audio output
          const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (base64Audio) {
            this.audioService.playAudioChunk(base64Audio);
          }

          // Handle transcription (Alex's text)
          const alexText = message.serverContent?.modelTurn?.parts?.[0]?.text;
          if (alexText) {
            this.currentAlexMessage += alexText;
            this.onMessageCallback({
              role: 'alex',
              text: this.currentAlexMessage,
              timestamp: new Date()
            });
          }

          // Handle user transcription (if enabled in config)
          // The field name might vary depending on the SDK version, using any to bypass strict check
          const userText = message.serverContent?.userTurn?.parts?.[0]?.text;
          if (userText) {
            this.onMessageCallback({
              role: 'user',
              text: userText,
              timestamp: new Date()
            });
          }

          // Reset Alex message on turn complete
          if (message.serverContent?.turnComplete) {
            this.currentAlexMessage = "";
          }

          // Handle interruption
          if (message.serverContent?.interrupted) {
            // In a real app, we'd stop the audio service playback here
            console.log("Interrupted");
          }
        },
        onerror: (error) => console.error("Live API error:", error),
        onclose: () => console.log("Live API closed"),
      },
    });
  }

  disconnect() {
    this.audioService.stopCapture();
    this.session?.close();
    this.session = null;
  }

  sendText(text: string) {
    this.session?.sendRealtimeInput({ text });
    this.onMessageCallback({
      role: 'user',
      text,
      timestamp: new Date()
    });
  }
}
