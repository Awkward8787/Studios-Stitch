
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
      supabaseUrl: '',
      supabaseAnonKey: '',
      stripePublicKey: '',
      printfulApiKey: 'KwSxNJ1mHlNYUJZ57eqOIAXQXQ9250Q19a2CHEas'
    };
  }

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AppConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
    // Trigger a page reload or service re-init logic here if necessary
    window.location.reload(); 
  }

  isConfigured(): boolean {
    return !!(this.config.supabaseUrl && this.config.supabaseAnonKey && this.config.stripePublicKey);
  }
}

export const configService = new ConfigService();
