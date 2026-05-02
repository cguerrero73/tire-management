/**
 * API Service
 *
 * HTTP client wrapper for EAM backend.
 * Calls are made to the EAM server using the baseUrl provided by the caller.
 */

export interface ApiRequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, string | number | boolean>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError extends Error {
  status: number;
  data?: any;
}

/**
 * Get EAM session params from URL
 */
function getEamSessionParams(): { eamid: string; tenant: string } {
  const params = new URLSearchParams(window.location.search);
  return {
    eamid: params.get('eamid') || '',
    tenant: params.get('tenant') || '',
  };
}

/**
 * Send error to parent window (EAM context)
 */
function sendErrorToParent(error: ApiError, url: string): void {
  if (window.parent !== window) {
    window.parent.postMessage(
      {
        type: 'TIRE_MGMT_ERROR',
        error: error.message,
        status: error.status,
        url: url,
        timestamp: Date.now(),
      },
      '*',
    );
  }
}

/**
 * Build full URL with baseUrl, eamid, tenant, and custom params
 */
function buildFullUrl(
  baseUrl: string,
  url: string,
  eamid: string,
  tenant: string,
  customParams?: Record<string, string | number | boolean>,
): string {
  const fullUrl = baseUrl + url;

  const params = new URLSearchParams();
  if (eamid) params.set('eamid', eamid);
  if (tenant) params.set('tenant', tenant);
  if (customParams) {
    Object.entries(customParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }

  const query = params.toString();
  return fullUrl + (query ? '?' + query : '');
}

/**
 * Make an HTTP request with EAM headers and params
 */
async function request<T = any>(
  options: ApiRequestOptions,
  baseUrl: string,
): Promise<ApiResponse<T>> {
  const { url, method = 'GET', params, body, headers = {}, timeout = 30000 } = options;

  // Get EAM session params from URL
  const { eamid, tenant } = getEamSessionParams();

  // Build headers with XMLHTTP required by EAM
  const mergedHeaders: Record<string, string> = {
    'Request-Type': 'XMLHTTP',
    'Request-Source': 'XMLHTTP',
    'Content-Type': 'application/json',
    ...headers,
  };

  // Build full URL with baseUrl and params
  const fullUrl = buildFullUrl(baseUrl, url, eamid, tenant, params);

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
      if (response.status === 401 || response.status === 403) {
        window.dispatchEvent(new CustomEvent('eam-session-timeout'));
      }

      const error = new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        data,
      ) as ApiError;

      sendErrorToParent(error, url);
      throw error;
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
      sendErrorToParent(error, url);
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        const timeoutError = new ApiError(`Request timeout after ${timeout}ms`, 408) as ApiError;
        sendErrorToParent(timeoutError, url);
        throw timeoutError;
      }

      const genericError = new ApiError(error.message, 0) as ApiError;
      sendErrorToParent(genericError, url);
      throw genericError;
    }

    const unknownError = new ApiError('Unknown error', 0) as ApiError;
    sendErrorToParent(unknownError, url);
    throw unknownError;
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
 * All methods require baseUrl as the first argument after url for GET, or as third arg for POST/PUT/DELETE/PATCH
 */
export const ApiService = {
  /**
   * GET request
   * @param url - API endpoint path (e.g., '/TESTFUNCTION.LST')
   * @param params - Query parameters
   * @param baseUrl - EAM server base URL (e.g., 'https://us1.eam.hxgnsmartcloud.com')
   */
  get<T = any>(
    url: string,
    params: Record<string, string | number | boolean> | undefined,
    baseUrl: string,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'GET', params }, baseUrl);
  },

  /**
   * POST request
   */
  post<T = any>(
    url: string,
    body: any,
    baseUrl: string,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'POST', body, ...options }, baseUrl);
  },

  /**
   * PUT request
   */
  put<T = any>(
    url: string,
    body: any,
    baseUrl: string,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'PUT', body, ...options }, baseUrl);
  },

  /**
   * DELETE request
   */
  delete<T = any>(
    url: string,
    params: Record<string, string | number | boolean> | undefined,
    baseUrl: string,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'DELETE', params }, baseUrl);
  },

  /**
   * PATCH request
   */
  patch<T = any>(
    url: string,
    body: any,
    baseUrl: string,
    options?: Partial<ApiRequestOptions>,
  ): Promise<ApiResponse<T>> {
    return request<T>({ url, method: 'PATCH', body, ...options }, baseUrl);
  },
};

export default ApiService;
