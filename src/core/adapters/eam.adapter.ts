/**
 * EAM Adapter
 *
 * Abstracts all EAM-specific interactions behind a clean interface.
 * This is the ONLY file that should know about EAM's internals.
 *
 * If EAM changes its API, session storage location, or headers,
 * you only need to update this file.
 */

import { TenantConfig } from '../models/tenant-config.model';

declare global {
  interface Window {
    EAM: any;
    gAppData: any;
  }
}

/**
 * Check if we're running inside EAM
 */
export function isRunningInEAM(): boolean {
  return typeof window !== 'undefined' && (!!window.EAM || !!window.gAppData);
}

/**
 * Get the current EAM session ID
 */
export function getSessionId(): string | null {
  if (!isRunningInEAM()) return null;

  try {
    // Try EAM.SessionStorage first
    if (window.EAM?.SessionStorage) {
      return window.EAM.SessionStorage.getEamId() || null;
    }
    // Fallback to gAppData
    if (window.gAppData?.storageDataForLogin?.eamid) {
      return window.gAppData.storageDataForLogin.eamid;
    }
  } catch (error) {
    console.warn('[EAMAdapter] Failed to get session ID:', error);
  }
  return null;
}

/**
 * Get the current tenant ID
 */
export function getTenant(): string {
  if (!isRunningInEAM()) return 'default';

  try {
    // Try EAM.SessionStorage first
    if (window.EAM?.SessionStorage) {
      return window.EAM.SessionStorage.getTenant() || 'default';
    }
    // Fallback to gAppData
    if (window.gAppData?.storageDataForLogin?.tenant) {
      return window.gAppData.storageDataForLogin.tenant;
    }
  } catch (error) {
    console.warn('[EAMAdapter] Failed to get tenant:', error);
  }
  return 'default';
}

/**
 * Get the current user ID
 */
export function getUserId(): string | null {
  if (!isRunningInEAM()) return null;

  try {
    if (window.gAppData?.storageDataForLogin?.userid) {
      return window.gAppData.storageDataForLogin.userid;
    }
    if (window.EAM?.UserData) {
      return window.EAM.UserData.getUserId?.() || null;
    }
  } catch (error) {
    console.warn('[EAMAdapter] Failed to get user ID:', error);
  }
  return null;
}

/**
 * Get EAM-specific headers for HTTP requests
 * Based on the patterns found in app.js
 */
export function getEAMHeaders(): Record<string, string> {
  return {
    'Request-Type': 'XMLHTTP',
    'Request-Source': 'XMLHTTP',
  };
}

/**
 * Get EAM-specific params for HTTP requests
 * Includes session and tenant identification
 */
export function getEAMParams(): Record<string, string> {
  return {
    eamid: getSessionId() || '',
    tenant: getTenant(),
  };
}

/**
 * Build a URL for EAM backend communication
 *
 * @param systemFunction - The EAM system function (e.g., 'TM_TIRES')
 * @param action - Optional action suffix (EVT, FCS, CST, WFE, etc.)
 * @param pageAction - Optional pageaction (SAVE, DELETE)
 * @param config - Optional config override
 */
export function buildEAMUrl(
  systemFunction: string,
  action?: string,
  pageAction?: 'SAVE' | 'DELETE',
  config?: TenantConfig,
): string {
  const api = config?.api;
  const baseUrl = api?.baseUrl || '';
  const sfPrefix = api?.systemFunctionPrefix || '';

  // Build the system function with optional prefix
  const fullSf = sfPrefix ? `${sfPrefix}_${systemFunction}` : systemFunction;

  // Start with base URL
  let url = `${baseUrl}/${fullSf}`;

  // Add action suffix if provided
  if (action) {
    url += `.${action}`;
  }

  // Add .xmlhttp for direct calls
  if (!action || !['SAVE', 'DELETE'].includes(action)) {
    if (!url.endsWith('.xmlhttp')) {
      url += '.xmlhttp';
    }
  }

  // Add pageaction for SAVE/DELETE
  if (pageAction) {
    url += `?pageaction=${pageAction}`;
  }

  return url;
}

/**
 * Get system function from the current EAM context
 * Useful when running inside an EAM screen
 */
export function getCurrentSystemFunction(): string | null {
  if (!isRunningInEAM()) return null;

  try {
    // Try to get from the current viewport/panel
    const viewport = window.EAM?.Viewport;
    if (viewport?.getSystemFunction) {
      return viewport.getSystemFunction();
    }
  } catch (error) {
    console.warn('[EAMAdapter] Failed to get current system function:', error);
  }
  return null;
}

/**
 * EAM Adapter Singleton
 * Provides a clean API surface for EAM interactions
 */
export const EAMAdapter = {
  isRunningInEAM,
  getSessionId,
  getTenant,
  getUserId,
  getEAMHeaders,
  getEAMParams,
  buildEAMUrl,
  getCurrentSystemFunction,
};

export default EAMAdapter;
