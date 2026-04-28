import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { ConfigService } from './core/services/config.service';
import { TenantConfig } from './core/models/tenant-config.model';

// Re-export for external use
export { ConfigService } from './core/services/config.service';
export { TenantConfig } from './core/models/tenant-config.model';

export function initializeAppConfig(): ApplicationConfig {
  // Try to get config from window (set by EAM bootstrap) or use default
  const windowConfig = (typeof window !== 'undefined' &&
    (window as any)['TireManagementConfig']) as TenantConfig | undefined;
  const config = ConfigService.initialize(windowConfig);

  console.log('[App] Config initialized for tenant:', config.tenant);

  return {
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideRouter([]),
      provideHttpClient(),
      // Provide config as a token
      { provide: 'TENANT_CONFIG', useValue: config },
    ],
  };
}

// Use the initialized config
export const appConfig: ApplicationConfig = initializeAppConfig();
