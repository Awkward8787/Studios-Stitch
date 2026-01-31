
import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private getAI() {
    // Ensuring the API key is retrieved correctly from process.env
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API: No API_KEY detected in process.env.");
    }
    return new GoogleGenAI({ apiKey: (apiKey || '') as string });
  }

  /**
   * Generates high-quality images using Gemini 3 Pro Image
   */
  async generateImage(prompt: string, config: { aspectRatio: string, imageSize: string }): Promise<string> {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: config.aspectRatio as any,
          imageSize: config.imageSize as any
        }
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    throw new Error("No image data returned from model. Reconstruction failed.");
  }

  /**
   * Edits an image using Gemini 2.5 Flash Image
   */
  async editImage(base64Image: string, prompt: string): Promise<string> {
    const ai = this.getAI();
    const parts = base64Image.split(',');
    if (parts.length < 2) throw new Error("Invalid image format provided for surgery.");
    
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const data = parts[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: prompt }
        ]
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const resParts = candidates[0].content?.parts;
      if (resParts) {
        for (const part of resParts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    throw new Error("No edited image data returned. Surgery aborted.");
  }

  /**
   * Analyzes an image using Gemini 3 Pro Preview
   */
  async analyzeImage(base64Image: string, question: string = "Analyze this image for fashion style."): Promise<string | undefined> {
    const ai = this.getAI();
    const parts = base64Image.split(',');
    if (parts.length < 2) return undefined;
    
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const data = parts[1];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: question }
        ]
      }
    });

    // Use .text property directly as per SDK guidelines
    return response.text;
  }

  /**
   * Fashion trend analysis with Google Search Grounding
   */
  async getTrends(query: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the latest streetwear trends related to: ${query}`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const candidates = response.candidates;
    const sources: { title: string; uri: string }[] = [];
    
    if (candidates && candidates.length > 0) {
      const chunks = candidates[0].groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sources.push({
              title: chunk.web.title || 'Source',
              uri: chunk.web.uri
            });
          }
        });
      }
    }

    return {
      text: response.text || "No trend data returned.",
      sources
    };
  }
}

export const geminiService = new GeminiService();
