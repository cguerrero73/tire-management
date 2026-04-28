/**
 * Config Loader
 *
 * Loads tenant-specific configuration from JSON files.
 * Falls back to 'default' config if tenant-specific one doesn't exist.
 *
 * Strategy:
 * 1. Try to load /configs/{tenant}/config.json
 * 2. If not found, fall back to /configs/default/config.json
 */

import { TenantConfig, TenantConfigSchema } from '../core/models/tenant-config.model';

let cachedConfig: TenantConfig | null = null;

/**
 * Fetch config JSON from the given URL
 */
async function fetchConfig(url: string): Promise<TenantConfig> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load config from ${url}: ${response.status}`);
  }
  const json = await response.json();
  return TenantConfigSchema.parse(json);
}

/**
 * Load configuration for the specified tenant
 * Falls back to 'default' if tenant-specific config doesn't exist
 */
export async function loadConfig(tenant: string): Promise<TenantConfig> {
  // Return cached config if already loaded
  if (cachedConfig) {
    return cachedConfig;
  }

  const configsBasePath = getConfigsBasePath();

  // Try tenant-specific config first
  const tenantConfigUrl = `${configsBasePath}/${tenant}/config.json`;
  const defaultConfigUrl = `${configsBasePath}/default/config.json`;

  try {
    console.log(`[ConfigLoader] Trying tenant config: ${tenantConfigUrl}`);
    cachedConfig = await fetchConfig(tenantConfigUrl);
    console.log(`[ConfigLoader] Loaded tenant config for: ${tenant}`);
  } catch (error) {
    console.warn(`[ConfigLoader] Tenant config not found, falling back to default: ${error}`);
    cachedConfig = await fetchConfig(defaultConfigUrl);
    console.log(`[ConfigLoader] Loaded default config`);
  }

  // Validate required fields
  validateConfig(cachedConfig);

  return cachedConfig;
}

/**
 * Get the base path for configs
 * Can be overridden via window.TireManagementConfigsBasePath
 */
function getConfigsBasePath(): string {
  if (typeof window !== 'undefined' && window['TireManagementConfigsBasePath']) {
    return window['TireManagementConfigsBasePath'];
  }
  // Default path relative to the app root
  return '/configs';
}

/**
 * Get the currently loaded config (synchronous)
 * Returns null if not yet loaded
 */
export function getConfig(): TenantConfig | null {
  return cachedConfig;
}

/**
 * Clear cached config (useful for testing or re-initialization)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
}

/**
 * Validate that required config fields are present
 */
function validateConfig(config: TenantConfig): void {
  const required: Array<keyof TenantConfig> = ['tenant', 'api'];

  for (const field of required) {
    if (!(field in config)) {
      console.warn(`[ConfigLoader] Missing required field: ${field}. Using defaults.`);
    }
  }
}

/**
 * Reload config (force refresh)
 */
export async function reloadConfig(tenant: string): Promise<TenantConfig> {
  clearConfigCache();
  return loadConfig(tenant);
}
