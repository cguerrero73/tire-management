/**
 * API Service
 *
 * HTTP client wrapper that automatically includes EAM headers and params.
 * All API calls to the EAM backend should go through this service.
 */

import { EAMAdapter } from '../adapters/eam.adapter';
import { TenantConfig } from '../models/tenant-config.model';

export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, string | number | boolean>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  config?: TenantConfig;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Build full URL with EAM params
 */
function buildUrlWithParams(
  baseUrl: string,
  params?: Record<string, string | number | boolean>,
): string {
  if (!params || Object.keys(params).length === 0) {
    return baseUrl;
  }

  const url = new URL(baseUrl, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
  return url.pathname + url.search;
}

/**
 * Make an HTTP request with EAM headers
 */
async function request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { url, method = 'GET', params, body, headers = {}, timeout = 30000, config } = options;

  // Merge EAM headers with custom headers
  const eamHeaders = EAMAdapter.getEAMHeaders();
  const mergedHeaders = {
    ...eamHeaders,
    'Content-Type': 'application/json',
    ...headers,
  };

  // Build URL with EAM params (eamid, tenant)
  const eamParams = EAMAdapter.getEAMParams();
  const allParams = { ...eamParams, ...params };
  const fullUrl = buildUrlWithParams(url, allParams);

  // Build fetch options
  const fetchOptions: RequestInit = {
    method,
    headers: mergedHeaders,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  fetchOptions.signal = controller.signal;

  try {
    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeoutId);

    // Parse response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse JSON response
    let data: T;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as any;
    }

    // Handle error responses
    if (!response.ok) {
      // Check for session timeout
      if (response.status === 401 || response.status === 403) {
        console.error('[ApiService] Session timeout detected');
        window.dispatchEvent(new CustomEvent('eam-session-timeout'));
      }
      throw new ApiError(`HTTP ${response.status}: ${response.statusText}`, response.status, data);
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError(`Request timeout after ${timeout}ms`, 408);
      }
      throw new ApiError(error.message, 0);
    }

    throw new ApiError('Unknown error', 0);
  }
}

/**
 * Custom API Error
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Methods for each HTTP verb
 */
export const ApiService = {
  /**
   * GET request
   */
  get<T = any>(
    url: string,
    params?: Record<string, string | number | boolean>,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'GET', params, ...options });
  },

  /**
   * POST request
   */
  post<T = any>(
    url: string,
    body?: any,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'POST', body, ...options });
  },

  /**
   * PUT request
   */
  put<T = any>(
    url: string,
    body?: any,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'PUT', body, ...options });
  },

  /**
   * DELETE request
   */
  delete<T = any>(
    url: string,
    params?: Record<string, string | number | boolean>,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'DELETE', params, ...options });
  },

  /**
   * PATCH request
   */
  patch<T = any>(
    url: string,
    body?: any,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'PATCH', body, ...options });
  },
};

export default ApiService;
