
export interface AppConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  stripePublicKey: string;
  printfulApiKey: string;
}

const STORAGE_KEY = 'studios_stitch_config';

function fromEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

class ConfigService {
  private config: AppConfig;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.config = saved ? JSON.parse(saved) : {
      supabaseUrl: fromEnv('VITE_SUPABASE_URL'),
      supabaseAnonKey: fromEnv('VITE_SUPABASE_ANON_KEY'),
      stripePublicKey: fromEnv('VITE_STRIPE_PUBLISHABLE_KEY'),
      printfulApiKey: fromEnv('VITE_PRINTFUL_API_KEY'),
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
