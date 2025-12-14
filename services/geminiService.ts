import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL, SYSTEM_INSTRUCTION } from "../constants";
import { Message } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;
  private model: string;

  constructor() {
    // API Key must be set in environment variables
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
      console.warn("API_KEY is not set in process.env");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.model = GEMINI_MODEL;
  }

  /**
   * Initializes a new chat session with history
   */
  startChat(history: Message[]) {
    // Convert app message format to API history format
    const apiHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

    this.chat = this.ai.chats.create({
      model: this.model,
      history: apiHistory,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }

  /**
   * Sends a message and yields streaming chunks
   */
  async *sendMessageStream(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.chat) {
      throw new Error("Chat not initialized. Call startChat first.");
    }

    try {
      const resultStream = await this.chat.sendMessageStream({ message });
      
      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          yield c.text;
        }
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  /**
   * Generates an image using Pollinations.ai (Free, No Billing Required)
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Simulate a brief processing delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));

      const encodedPrompt = encodeURIComponent(prompt);
      // Add a random seed to ensure a new image is generated each time
      const seed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

      // Return the image as a markdown image link
      return `![Generated Image](${imageUrl})`;
    } catch (error) {
      console.error("Image Generation Error:", error);
      return `Sorry, I encountered an error generating the image.`;
    }
  }
}

export const geminiService = new GeminiService();