/**
 * Config Service
 *
 * Provides access to the tenant configuration throughout the app.
 * Acts as a central store for config values.
 */

import { TenantConfig, getDefaultConfig } from '../models/tenant-config.model';
import { TenantService } from './tenant.service';

let currentConfig: TenantConfig | null = null;
let configListeners: Array<(config: TenantConfig) => void> = [];

/**
 * Initialize config from window object (set by bootstrap)
 * or from a direct config object
 */
export function initializeConfig(config?: TenantConfig): TenantConfig {
  if (config) {
    currentConfig = config;
  } else if (typeof window !== 'undefined' && (window as any)['TireManagementConfig']) {
    currentConfig = (window as any)['TireManagementConfig'];
  } else {
    // Fallback to default config
    currentConfig = getDefaultConfig();
  }

  // Notify listeners
  notifyListeners();

  return currentConfig;
}

/**
 * Get current config
 */
export function getConfig(): TenantConfig {
  if (!currentConfig) {
    return getDefaultConfig();
  }
  return currentConfig;
}

/**
 * Get a specific config value by path
 * e.g., getConfigValue('features.map.enabled')
 */
export function getConfigValue<T = any>(path: string, defaultValue?: T): T {
  const config = getConfig();
  const keys = path.split('.');
  let value: any = config;

  for (const key of keys) {
    if (value === undefined || value === null) {
      return defaultValue as T;
    }
    value = value[key];
  }

  return value !== undefined ? value : (defaultValue as T);
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featurePath: string): boolean {
  return getConfigValue<boolean>(`features.${featurePath}`, false);
}

/**
 * Subscribe to config changes
 * Returns unsubscribe function
 */
export function onConfigChange(listener: (config: TenantConfig) => void): () => void {
  configListeners.push(listener);
  return () => {
    configListeners = configListeners.filter((l) => l !== listener);
  };
}

/**
 * Notify all listeners of config change
 */
function notifyListeners(): void {
  if (!currentConfig) return;

  configListeners.forEach((listener) => {
    try {
      listener(currentConfig!);
    } catch (error) {
      console.error('[ConfigService] Listener error:', error);
    }
  });
}

/**
 * Get API configuration for EAM calls
 */
export function getApiConfig() {
  return getConfig().api;
}

/**
 * Get current tenant info
 */
export function getTenantInfo() {
  return TenantService.detectTenant();
}

/**
 * Config Service singleton
 */
export const ConfigService = {
  initialize: initializeConfig,
  get: getConfig,
  getValue: getConfigValue,
  isFeatureEnabled,
  onChange: onConfigChange,
  getApiConfig,
  getTenantInfo,
};

export default ConfigService;
