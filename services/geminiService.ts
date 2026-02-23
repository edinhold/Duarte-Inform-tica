
import { GoogleGenAI, Modality } from "@google/genai";

export const geminiService = {
  async getFastResponse(prompt: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      return "Estou processando sua solicitação...";
    }
  },

  async analyzeImage(base64: string, mimeType: string, prompt: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType } },
            { text: prompt }
          ]
        },
      });
      return response.text;
    } catch (error) {
      return "Não consegui analisar a imagem no momento.";
    }
  },

  async searchInformation(query: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const text = response.text;
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.web)
        ?.map(chunk => ({ title: chunk.web.title, uri: chunk.web.uri })) || [];
        
      return { text, links };
    } catch (error) {
      return { text: "Erro ao buscar informações em tempo real.", links: [] };
    }
  },

  async getNearbyRecommendations(lat: number, lng: number) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Quais são os 3 melhores estabelecimentos comerciais ou pontos de interesse nestas coordenadas? Liste como tópicos curtos com links.",
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng }
            }
          }
        },
      });
      const text = response.text || "Explore as opções ao seu redor!";
      const links = response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.maps)
        ?.map(chunk => ({ title: chunk.maps.title, uri: chunk.maps.uri })) || [];
      return { text, links };
    } catch (error) {
      return { text: "Explore as opções ao seu redor!", links: [] };
    }
  },

  async getChatSupportResponse(userMessage: string, context: string) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Você é um assistente de suporte do sistema Delivora. Contexto: ${context}. Pergunta: ${userMessage}. Resposta curta e profissional em PT-BR.`,
      });
      return response.text;
    } catch (error) {
      return "Um atendente humano entrará em contato em breve.";
    }
  },

  async getMerchantStrategy(orderCount: number, ratings: number[]) {
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    return this.getFastResponse(`O lojista teve ${orderCount} pedidos e avaliação média de ${avgRating}. Forneça uma dica estratégica curta de 1 frase para melhorar o negócio.`);
  },

  async getRouteBriefing(stops: string[]) {
    return this.getFastResponse(`O motorista tem as seguintes paradas: ${stops.join(', ')}. Forneça um resumo motivador e curto da rota em 1 frase.`);
  },

  async getAdminInsights(totalRevenue: number, totalUsers: number) {
    return this.getFastResponse(`Analise o desempenho da plataforma: Receita total R$ ${totalRevenue}, Usuários: ${totalUsers}. Forneça um breve insight de crescimento de 1 frase.`);
  },

  async getCRMInsights(orderData: any, userData: any) {
    const prompt = `Como consultor de CRM, analise estes dados de delivery:
    - Total de pedidos: ${orderData.length}
    - Faturamento: R$ ${orderData.reduce((a: any, b: any) => a + b.total, 0)}
    - Clientes cadastrados: ${userData.filter((u: any) => u.role === 'USER').length}
    Sugira uma ação de marketing para reter clientes 'em risco' e uma para premiar os VIPs. Responda em 2 frases curtas.`;
    return this.getFastResponse(prompt);
  },

  async getProfileSecurityReview(userName: string, role: string, document: string) {
    return this.getFastResponse(`Analise este novo cadastro: Nome: ${userName}, Função: ${role}, Documento: ${document}. Parecer de segurança de 1 frase.`);
  }
};
