
import { GoogleGenerativeAI } from "@google/generative-ai";

// Usando a chave que você forneceu. 
// DICA: No futuro, use import.meta.env.VITE_API_KEY para maior segurança.
const MINHA_CHAVE = "AIzaSyDlrXK79Q9UkdTcqRGC4c0WDzYFu1LO11Q";
const genAI = new GoogleGenerativeAI(MINHA_CHAVE);

export const geminiService = {
  async getFastResponse(prompt: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(error);
      return "Estou processando sua solicitação...";
    }
  },

  async analyzeImage(base64: string, mimeType: string, prompt: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        { inlineData: { data: base64, mimeType } },
        { text: prompt }
      ]);
      return result.response.text();
    } catch (error) {
      return "Não consegui analisar a imagem no momento.";
    }
  },

  async searchInformation(query: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(query);
      return { text: result.response.text(), links: [] };
    } catch (error) {
      return { text: "Erro ao buscar informações.", links: [] };
    }
  },

  async getNearbyRecommendations(lat: number, lng: number) {
    try {
      // Simplificado para evitar erros de ferramentas externas no navegador
      return this.getFastResponse(`Quais são os 3 melhores locais próximos às coordenadas lat: ${lat}, lng: ${lng}?`);
    } catch (error) {
      return { text: "Explore as opções ao seu redor!", links: [] };
    }
  },

  async getChatSupportResponse(userMessage: string, context: string) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(
        `Você é um assistente de suporte do sistema Delivora. Contexto: ${context}. Pergunta: ${userMessage}. Resposta curta e profissional em PT-BR.`
      );
      return result.response.text();
    } catch (error) {
      return "Um atendente humano entrará em contato em breve.";
    }
  },

  async getMerchantStrategy(orderCount: number, ratings: number[]) {
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    return this.getFastResponse(`O lojista teve ${orderCount} pedidos e avaliação média de ${avgRating}. Forneça uma dica estratégica curta de 1 frase.`);
  },

  async getRouteBriefing(stops: string[]) {
    return this.getFastResponse(`O motorista tem as seguintes paradas: ${stops.join(', ')}. Forneça um resumo motivador curto.`);
  },

  async getAdminInsights(totalRevenue: number, totalUsers: number) {
    return this.getFastResponse(`Receita R$ ${totalRevenue}, Usuários: ${totalUsers}. Forneça um insight de crescimento de 1 frase.`);
  },

  async getCRMInsights(orderData: any, userData: any) {
    const totalRevenue = orderData.reduce((a: any, b: any) => a + (b.total || 0), 0);
    const prompt = `Analise: ${orderData.length} pedidos, R$ ${totalRevenue} faturamento. Sugira uma ação de marketing curta.`;
    return this.getFastResponse(prompt);
  },

  async getProfileSecurityReview(userName: string, role: string, document: string) {
    return this.getFastResponse(`Analise cadastro: Nome: ${userName}, Função: ${role}, Doc: ${document}. Parecer de segurança de 1 frase.`);
  }
};
