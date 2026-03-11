import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Env } from "../env";
import MercadoPagoConfig, { Preference, OAuth } from "mercadopago";

@Injectable()
export class PaymentService {
  constructor(private readonly config: ConfigService<Env>) {}

  getMpClient(accessToken?: string) {
    return new MercadoPagoConfig({
      accessToken: accessToken ?? this.config.get("MP_ACCESS_TOKEN")!,
    });
  }

  getOAuthUrl(storeId: string): string {
    const clientId = this.config.get("MP_CLIENT_ID")!;
    const redirectUri = this.config.get("MP_REDIRECT_URI")!;
    const state = storeId;

    return (
      `https://auth.mercadopago.com/authorization` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&platform_id=mp` +
      `&state=${state}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`
    );
  }

  async exchangeCodeForTokens(code: string) {
    const clientId = this.config.get("MP_CLIENT_ID")!;
    const clientSecret = this.config.get("MP_CLIENT_SECRET")!;
    const redirectUri = this.config.get("MP_REDIRECT_URI")!;

    const response = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`MP OAuth error: ${JSON.stringify(error)}`);
    }

    return response.json() as Promise<{
      access_token: string;
      refresh_token: string;
      user_id: number;
      public_key: string;
    }>;
  }

  // async createPreference(
  //   accessToken: string,
  //   payload: {
  //     orderId: string;
  //     storeSlug: string;
  //     items: { id: string; title: string; unit_price: number; quantity: number }[];
  //     backUrls: { success: string; failure: string; pending: string };
  //   },
  // ) {
  //   const client = this.getMpClient(accessToken);
  //   const preference = new Preference(client);

  //   return preference.create({
  //     body: {
  //       external_reference: payload.orderId,
  //       items: payload.items,
  //       back_urls: payload.backUrls,
  //       // auto_return: "approved",
  //       notification_url: `${this.config.get("MP_REDIRECT_URI")!.replace("/payment/callback", "")}/payment/webhook`,
  //     },
  //   });
  // }

  async createPreference(
    accessToken: string,
    payload: {
      orderId: string;
      storeSlug: string;
      items: { id: string; title: string; unit_price: number; quantity: number }[];
      backUrls: { success: string; failure: string; pending: string };
    },
  ) {
    const client = this.getMpClient(accessToken);
    const preference = new Preference(client);
  
    // return preference.create({
    //   body: {
    //     external_reference: payload.orderId,
    //     items: payload.items.map((item) => ({
    //       ...item,
    //       unit_price: Math.round(item.unit_price), // sin decimales
    //       currency_id: "UYU",
    //     })),
    //     back_urls: payload.backUrls,
    //     auto_return: "approved",
    //     // notification_url solo en producción
    //     ...(process.env.NODE_ENV === "production" && {
    //       notification_url: `${this.config.get("MP_REDIRECT_URI")!.replace("/payment/callback", "")}/payment/webhook`,
    //     }),
    //   },
    // });

    return preference.create({
      body: {
        external_reference: payload.orderId,
        items: payload.items.map((item) => ({
          ...item,
          unit_price: Math.round(item.unit_price),
          currency_id: "UYU",
        })),
        back_urls: {
          success: payload.backUrls.success,
          failure: payload.backUrls.failure,
          pending: payload.backUrls.pending,
        },
        auto_return: "approved",
        // producción
        ...(process.env.NODE_ENV === "production" && {
          notification_url: `${this.config.get("MP_REDIRECT_URI")!.replace("/payment/callback", "")}/payment/webhook`,
        }),
      },
    });
  }
}