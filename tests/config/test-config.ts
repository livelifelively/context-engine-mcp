export interface TestConfig {
  apiBaseUrl: string;
  testMode: 'mock' | 'real' | 'integration';
  timeout: number;
  apiKey?: string;
  retries: number;
}

export function getTestConfig(): TestConfig {
  return {
    apiBaseUrl: process.env.TEST_API_BASE_URL || 
                process.env.CONTEXT_ENGINE_SERVER_URL || 
                'https://contextengine.in',
    testMode: (process.env.TEST_MODE as 'mock' | 'real' | 'integration') || 'real',
    timeout: parseInt(process.env.TEST_TIMEOUT || '10000'),
    apiKey: process.env.TEST_API_KEY,
    retries: parseInt(process.env.TEST_RETRIES || '3')
  };
}

export function shouldUseRealApi(): boolean {
  const config = getTestConfig();
  return config.testMode === 'real' || config.testMode === 'integration';
}

export function getApiBaseUrl(): string {
  return getTestConfig().apiBaseUrl;
}
