
import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned from model");
  }

  /**
   * Edits an image using Gemini 2.5 Flash Image (Nano Banana)
   */
  async editImage(base64Image: string, prompt: string): Promise<string> {
    const ai = this.getAI();
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: prompt }
        ]
      }
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No edited image data returned");
  }

  /**
   * Analyzes an image using Gemini 3 Pro Preview
   */
  async analyzeImage(base64Image: string, question: string = "Analyze this image for fashion style, materials, and construction details."): Promise<string | undefined> {
    const ai = this.getAI();
    const mimeType = base64Image.split(';')[0].split(':')[1];
    const data = base64Image.split(',')[1];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { data, mimeType } },
          { text: question }
        ]
      }
    });

    return response.text;
  }

  /**
   * Fashion trend analysis with Google Search Grounding
   */
  async getTrends(query: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the latest streetwear and fashion trends related to: ${query}. Provide a concise summary and key styles.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((s: any) => s.uri) || [];

    return {
      text: response.text,
      sources
    };
  }
}

export const geminiService = new GeminiService();
