
import { ApiSettings } from '../types';

export interface CheckoutResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export const paymentService = {
  /**
   * Simulates the creation of a hosted checkout session via API
   */
  async createCheckoutSession(amount: number, settings: ApiSettings): Promise<CheckoutResponse> {
    // Simula atraso da rede representando chamada real
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Validação das credenciais sincronizadas no Painel Admin
    if (!settings.apiKey || !settings.apiKey.includes('|')) {
      return {
        success: false,
        error: `Erro de Sincronização: O gateway de pagamento não foi devidamente configurado e sincronizado no Painel de Administração Duarte.`
      };
    }

    if (!settings.webhookUrl || !settings.webhookUrl.startsWith('http')) {
       return {
         success: false,
         error: "Webhook Inválido: O endereço de notificação sincronizado não é acessível."
       };
    }

    // Em um cenário de produção, aqui faríamos um fetch() POST para o Provedor
    // Retornamos uma URL de checkout fictícia mas baseada no gateway salvo
    const providerUrl = settings.paymentGateway === 'Stripe' 
      ? `https://checkout.stripe.com/pay/cs_live_${Math.random().toString(36).substring(7)}` 
      : `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${Math.random().toString(10).substring(2)}`;

    return {
      success: true,
      url: providerUrl
    };
  },

  /**
   * Simula o recebimento de uma notificação de Webhook
   */
  async simulateWebhookEvent(transactionId: string, settings: ApiSettings): Promise<boolean> {
     console.log(`[Webhook Sinc] Duarte Core recebendo evento do gateway ${settings.paymentGateway} para TX: ${transactionId}`);
     // Simula a validação do Webhook Secret configurado pelo admin
     if (settings.webhookSecret.length < 5) {
        console.warn("[Webhook Warning] Secret não configurado ou muito curto.");
     }
     
     // Simula processamento de 1 segundo
     await new Promise(resolve => setTimeout(resolve, 1000));
     return true;
  }
};
