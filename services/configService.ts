
export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublicKey: string;
  printfulApiKey: string;
}

const STORAGE_KEY = 'studios_stitch_config';

class ConfigService {
  private config: AppConfig;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.config = saved ? JSON.parse(saved) : {
      supabaseUrl: 'https://zdsdfqknslcpgsjsalyo.supabase.co',
      supabaseAnonKey: 'sb_publishable_HwfP0kG2zq8JfBknh6y42Q_xkaMbza_', // Note: User provided this as public key
      stripePublicKey: 'pk_test_51GbGZhJsatT5gLNRN8Yp6q0Hl7fM8o2G1C6eR7k5Z8W3x5v4y3z2x1w0v9u8t7s6r5q4p3o2n1m0l9k8j7i6h5g4f3e2d1c0b0a',
      printfulApiKey: 'H0szAdD3mlptJzl2S8jYbWwMtUCAnf3AYtvkDYyU'
    };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    window.location.reload(); 
  }

  isConfigured(): boolean {
    return !!(this.config.supabaseUrl && this.config.supabaseAnonKey);
  }
}

export const configService = new ConfigService();
