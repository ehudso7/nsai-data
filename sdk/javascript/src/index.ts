/**
 * NSAI Data JavaScript SDK
 * Official JavaScript/TypeScript client for NSAI Data API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface ResearchQuery {
  query: string;
  outputFormat?: 'markdown' | 'json' | 'html';
  maxSources?: number;
  enableValidation?: boolean;
  includeSources?: boolean;
  webhookUrl?: string;
}

export interface ResearchResponse {
  researchId: string;
  status: string;
  report?: string;
  metadata?: Record<string, any>;
  sources?: Array<{
    url: string;
    title: string;
    snippet?: string;
  }>;
  durationMs?: number;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ResearchStatus {
  researchId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  currentStep?: string;
  estimatedCompletion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageStats {
  period: string;
  queriesCount: number;
  tokensUsed: number;
  sourcesAnalyzed: number;
  costUsd: number;
  remainingQuota?: number;
  resetAt?: string;
}

export class NSAIError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'NSAIError';
  }
}

export class AuthenticationError extends NSAIError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends NSAIError {
  constructor(message: string, public retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * NSAI Data API Client
 * 
 * @example
 * ```typescript
 * import { NSAIClient } from 'nsai-sdk';
 * 
 * const client = new NSAIClient('your-api-key');
 * const response = await client.research('What are the latest AI developments?');
 * console.log(response.report);
 * ```
 */
export class NSAIClient {
  private readonly client: AxiosInstance;
  private static readonly BASE_URL = 'https://api.nsaidata.com/v1';

  constructor(
    private apiKey: string,
    options?: {
      baseUrl?: string;
      timeout?: number;
      maxRetries?: number;
    }
  ) {
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    this.client = axios.create({
      baseURL: options?.baseUrl || NSAIClient.BASE_URL,
      timeout: options?.timeout || 300000, // 5 minutes
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'nsai-javascript/1.0.0'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      this.handleError.bind(this)
    );
  }

  /**
   * Create a new research query
   * 
   * @param query - The research question or topic
   * @param options - Additional options for the research
   * @returns Research response with report and metadata
   */
  async research(
    query: string,
    options?: Omit<ResearchQuery, 'query'>
  ): Promise<ResearchResponse> {
    const response = await this.client.post<ResearchResponse>('/research/query', {
      query,
      outputFormat: options?.outputFormat || 'markdown',
      maxSources: options?.maxSources || 10,
      enableValidation: options?.enableValidation !== false,
      includeSources: options?.includeSources !== false,
      webhookUrl: options?.webhookUrl
    });

    return response.data;
  }

  /**
   * Get the status of a research query
   */
  async getResearchStatus(researchId: string): Promise<ResearchStatus> {
    const response = await this.client.get<ResearchStatus>(
      `/research/status/${researchId}`
    );
    return response.data;
  }

  /**
   * Get research query history
   */
  async getResearchHistory(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<{ queries: ResearchResponse[]; total: number }> {
    const response = await this.client.get('/research/history', { params });
    return response.data;
  }

  /**
   * Cancel a research query
   */
  async cancelResearch(researchId: string): Promise<{ message: string }> {
    const response = await this.client.post(`/research/cancel/${researchId}`);
    return response.data;
  }

  /**
   * Get API usage statistics
   */
  async getUsage(period: 'current' | 'last_month' | 'all_time' = 'current'): Promise<UsageStats> {
    const response = await this.client.get<UsageStats>(`/usage/${period}`);
    return response.data;
  }

  /**
   * Wait for research to complete
   * 
   * @param researchId - The research ID to monitor
   * @param options - Polling options
   * @returns Completed research response
   */
  async waitForCompletion(
    researchId: string,
    options?: {
      pollingInterval?: number;
      timeout?: number;
    }
  ): Promise<ResearchResponse> {
    const interval = options?.pollingInterval || 2000; // 2 seconds
    const timeout = options?.timeout || 600000; // 10 minutes
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.getResearchStatus(researchId);
      
      if (status.status === 'completed') {
        return {
          researchId: status.researchId,
          status: status.status,
          createdAt: status.createdAt,
          // Fetch full result
          ...(await this.client.get<ResearchResponse>(`/research/${researchId}`)).data
        };
      }
      
      if (status.status === 'failed') {
        throw new NSAIError('Research query failed');
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new NSAIError('Research query timed out');
  }

  private async handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      if (status === 401) {
        throw new AuthenticationError('Invalid API key');
      }
      
      if (status === 403) {
        throw new AuthenticationError('Insufficient permissions');
      }
      
      if (status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
        throw new RateLimitError(
          `Rate limit exceeded. Retry after ${retryAfter} seconds`,
          retryAfter
        );
      }

      throw new NSAIError(
        data?.detail || data?.message || `API error: ${status}`
      );
    }

    if (error.request) {
      throw new NSAIError('Network error: No response from server');
    }

    throw new NSAIError(`Request error: ${error.message}`);
  }
}

// Export a default instance factory
export function createClient(apiKey: string, options?: any): NSAIClient {
  return new NSAIClient(apiKey, options);
}

// For CommonJS compatibility
export default NSAIClient;