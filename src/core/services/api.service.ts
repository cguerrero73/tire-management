/**
 * API Service
 *
 * HTTP client wrapper that automatically includes EAM headers and params.
 * All API calls to the EAM backend should go through this service.
 *
 * Reads eamid/tenant from URL params (passed from tire-mgmt-ef.js)
 * and adds XMLHTTP headers expected by EAM backend.
 *
 * When running inside an iframe, uses the parent window origin as base URL.
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
 * Get the base URL from the parent window (EAM context)
 */
function getParentBaseUrl(): string {
  if (window.parent !== window) {
    try {
      return window.parent.location.origin;
    } catch (e) {
      return '';
    }
  }
  return '';
}

/**
 * Build the full URL for EAM backend
 * When in iframe: uses parent origin + url
 * When standalone: uses the url directly
 */
function buildFullUrl(url: string): string {
  const parentOrigin = getParentBaseUrl();
  if (parentOrigin) {
    // Running inside EAM iframe - use parent origin
    return parentOrigin + url;
  }
  // Standalone mode
  return url;
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
 * Build URL with params
 */
function buildUrl(
  url: string,
  eamid: string,
  tenant: string,
  customParams?: Record<string, string | number | boolean>,
): string {
  // Use parent origin for the base
  const baseWithParent = buildFullUrl('/');
  const baseUrl = new URL(baseWithParent);

  // Navigate to the target URL path
  let fullUrl: URL;
  try {
    fullUrl = new URL(url, baseWithParent);
  } catch (e) {
    // If URL parsing fails, just prepend parent origin to the url
    return buildFullUrl(url) + buildQueryString(eamid, tenant, customParams);
  }

  // Add EAM session params
  if (eamid) fullUrl.searchParams.set('eamid', eamid);
  if (tenant) fullUrl.searchParams.set('tenant', tenant);

  // Add custom params
  if (customParams) {
    Object.entries(customParams).forEach(([key, value]) => {
      fullUrl.searchParams.set(key, String(value));
    });
  }

  return fullUrl.pathname + fullUrl.search;
}

/**
 * Build query string from params
 */
function buildQueryString(
  eamid: string,
  tenant: string,
  customParams?: Record<string, string | number | boolean>,
): string {
  const params = new URLSearchParams();
  if (eamid) params.set('eamid', eamid);
  if (tenant) params.set('tenant', tenant);
  if (customParams) {
    Object.entries(customParams).forEach(([key, value]) => {
      params.set(key, String(value));
    });
  }
  const query = params.toString();
  return query ? '?' + query : '';
}

/**
 * Make an HTTP request with EAM headers and params
 */
async function request<T = any>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
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

  // Build full URL with EAM params and parent origin
  const fullUrl = buildUrl(url, eamid, tenant, params);

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
