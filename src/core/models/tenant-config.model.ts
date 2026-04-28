/**
 * Tenant Configuration Model
 * 
 * Type definitions and Zod schemas for tenant-specific configuration.
 * This ensures type safety across all tenant configs.
 */

import { z } from 'zod';

// ================================
// Library Configuration
// ================================

export const LibraryConfigSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  type: z.enum(['js', 'css']),
  /** If true, will wait for this script before bootstrapping Angular */
  critical?: boolean,
});

export type LibraryConfig = z.infer<typeof LibraryConfigSchema>;

// ================================
// Feature Flags
// ================================

export const FeaturesConfigSchema = z.object({
  map: z.object({
    enabled: z.boolean(),
    defaultCenter: z.tuple([z.number(), z.number()]).optional(),
    defaultZoom: z.number().optional(),
    library: z.enum(['openlayers', 'leaflet', 'googlemaps']).optional(),
  }).optional(),
  offline: z.object({
    enabled: z.boolean(),
    syncInterval: z.number().optional(),
  }).optional(),
  notifications: z.object({
    enabled: z.boolean(),
    provider: z.enum(['websocket', 'polling']).optional(),
  }).optional(),
});

export type FeaturesConfig = z.infer<typeof FeaturesConfigSchema>;

// ================================
// API Configuration
// ================================

export const ApiConfigSchema = z.object({
  /** Base URL for EAM backend */
  baseUrl: z.string(),
  /** System function prefix for this module (e.g., 'TM' for Tire Management) */
  systemFunctionPrefix: z.string(),
  /** API version if applicable */
  version: z.string().optional(),
  /** Timeout for API requests in ms */
  timeout: z.number().optional(),
  /** Custom headers to include in all requests */
  headers: z.record(z.string()).optional(),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

// ================================
// Angular Configuration
// ================================

export const AngularConfigSchema = z.object({
  /** If true, use standalone bootstrapping */
  standalone: z.boolean(),
  /** Root component selector to bootstrap */
  rootComponent: z.string().optional(),
  /** Additional providers to include */
  providers: z.array(z.any()).optional(),
});

export type AngularConfig = z.infer<typeof AngularConfigSchema>;

// ================================
// UI/L10n Configuration
// ================================

export const UIConfigSchema = z.object({
  /** UI theme */
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  /** Language code */
  locale: z.string().default('en'),
  /** Date format pattern */
  dateFormat: z.string().optional(),
  /** Number format pattern */
  numberFormat: z.string().optional(),
  /** Custom CSS variables overrides */
  cssVariables: z.record(z.string()).optional(),
});

export type UIConfig = z.infer<typeof UIConfigSchema>;

// ================================
// Complete Tenant Config Schema
// ================================

export const TenantConfigSchema = z.object({
  /** Tenant identifier (must match directory name) */
  tenant: z.string(),
  /** Human-readable tenant name */
  tenantName: z.string().optional(),
  /** Environment: development | staging | production */
  environment: z.enum(['development', 'staging', 'production']).default('production'),
  /** API configuration */
  api: ApiConfigSchema,
  /** Feature flags */
  features: FeaturesConfigSchema.optional(),
  /** Libraries to load (CDN URLs, etc.) */
  libraries: z.array(LibraryConfigSchema).optional(),
  /** Angular-specific configuration */
  angular: AngularConfigSchema.optional(),
  /** UI and localization settings */
  ui: UIConfigSchema.optional(),
  /** Custom tenant-specific overrides */
  custom: z.record(z.any()).optional(),
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

// ================================
// Helper Functions
// ================================

/**
 * Get a default/fallback configuration
 * Useful for development without EAM context
 */
export function getDefaultConfig(): TenantConfig {
  return {
    tenant: 'default',
    tenantName: 'Default Configuration',
    environment: 'development',
    api: {
      baseUrl: '/api',
      systemFunctionPrefix: 'TM',
      timeout: 30000,
    },
    features: {
      map: {
        enabled: false,
      },
      notifications: {
        enabled: false,
      },
    },
    libraries: [],
    angular: {
      standalone: true,
      rootComponent: 'app-root',
    },
    ui: {
      theme: 'auto',
      locale: 'en',
    },
  };
}
