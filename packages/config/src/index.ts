export interface PlatformConfig {
  apiUrl: string;
  port: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
}

export const defaultConfig: PlatformConfig = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  port: parseInt(process.env.PORT || '3000'),
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
  database: {
    url: process.env.DATABASE_URL || 'postgres://localhost:5432/ai_platform'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};

export function getConfig(): PlatformConfig {
  return { ...defaultConfig };
}
