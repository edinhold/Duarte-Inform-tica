
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async getMerchantStrategy(orderCount: number, recentRatings: number[]) {
    try {
      const avgRating = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise estes dados de um restaurante: ${orderCount} pedidos hoje, nota média ${avgRating.toFixed(1)}. Forneça uma dica rápida (1 frase) para aumentar as vendas.`,
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Continue oferecendo um excelente serviço!";
    }
  },

  async getAdminInsights(totalRevenue: number, totalUsers: number) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o desempenho da plataforma: Receita total R$ ${totalRevenue}, Usuários: ${totalUsers}. Forneça um breve insight de crescimento.`,
      });
      return response.text;
    } catch (error) {
      return "Sua plataforma está crescendo de forma constante.";
    }
  }
};
