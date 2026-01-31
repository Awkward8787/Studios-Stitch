
import { GoogleGenAI } from "@google/genai";

class GeminiService {
  private getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API: No API_KEY found in process.env. System Lab may be limited.");
    }
    return new GoogleGenAI({ apiKey: (apiKey || '') as string });
  }

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

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No image data returned from model.");
  }

  async editImage(base64Image: string, prompt: string): Promise<string> {
    const ai = this.getAI();
    const parts = base64Image.split(',');
    if (parts.length < 2) throw new Error("Invalid image format.");
    
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

    if (response?.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    throw new Error("No edited image data returned.");
  }

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

    return response.text;
  }

  async getTrends(query: string) {
    const ai = this.getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for streetwear trends: ${query}`,
      config: { tools: [{ googleSearch: {} }] }
    });

    const sources = response?.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || ''
    })).filter((s: any) => s.uri) || [];

    return {
      text: response.text || "No response text.",
      sources
    };
  }
}

export const geminiService = new GeminiService();
