/**
 * Tenant Service
 *
 * Manages tenant detection and switching.
 * Provides reactive updates when tenant changes.
 */

import { EAMAdapter } from '../adapters/eam.adapter';

export interface TenantInfo {
  id: string;
  name?: string;
  environment?: 'development' | 'staging' | 'production';
}

/**
 * Detect current tenant from EAM context
 */
export function detectTenant(): TenantInfo {
  const tenantId = EAMAdapter.getTenant();

  return {
    id: tenantId || 'default',
    environment: getEnvironmentFromTenant(tenantId),
  };
}

/**
 * Infer environment from tenant ID naming convention
 * e.g., 'tenant-dev' -> development, 'tenant-staging' -> staging, 'tenant' -> production
 */
function getEnvironmentFromTenant(tenantId: string): 'development' | 'staging' | 'production' {
  if (!tenantId) return 'production';

  const lowerTenant = tenantId.toLowerCase();

  if (lowerTenant.includes('-dev') || lowerTenant.includes('_dev')) {
    return 'development';
  }
  if (
    lowerTenant.includes('-staging') ||
    lowerTenant.includes('_staging') ||
    lowerTenant.includes('-test')
  ) {
    return 'staging';
  }
  return 'production';
}

/**
 * Validate if a tenant ID is allowed
 * Can be used for access control
 */
export function isTenantAllowed(tenantId: string, allowedTenants?: string[]): boolean {
  if (!allowedTenants || allowedTenants.length === 0) {
    return true; // No restriction
  }
  return allowedTenants.includes(tenantId);
}

/**
 * Tenant Service singleton
 */
export const TenantService = {
  detectTenant,
  isTenantAllowed,
};

export default TenantService;
