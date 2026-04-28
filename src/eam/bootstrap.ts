/**
 * EAM Extensibility Framework Bootstrap
 *
 * This is the entry point that EAM loads when the EF screen is activated.
 * It follows the EAM.custom.AbstractExtensibleFramework pattern.
 *
 * Responsibilities:
 * 1. Detect current tenant from EAM.SessionStorage
 * 2. Load tenant-specific configuration
 * 3. Load required libraries (if not already loaded)
 * 4. Bootstrap the Angular application
 */

import { loadConfig, getConfig } from './config.loader';
import { TenantConfig } from '../core/models/tenant-config.model';
import { EAMAdapter } from '../core/adapters/eam.adapter';
import { LibraryLoader } from '../core/services/library-loader.service';

// CSS selectors for EF event binding
interface EFSelectors {
  [selector: string]: {
    beforerender?: (component: any) => void;
    afterrender?: (component: any) => void;
    afterlayout?: (component: any) => void;
  };
}

// Global reference to prevent re-initialization
declare global {
  interface Window {
    TireManagementEFInitialized: boolean;
  }
}

/**
 * EF Component Definition
 * Extends EAM.custom.AbstractExtensibleFramework as required by EAM
 */
Ext.define('EAM.custom.external_TIREMGMT', {
  extend: 'EAM.custom.AbstractExtensibleFramework',

  /**
   * Returns the CSS selectors and their event handlers.
   * EAM's event bus will listen for these and call our handlers.
   */
  getSelectors(): EFSelectors {
    return {
      '[extensibleFramework] [tabName=LST]': {
        beforerender: this.onBeforeRender.bind(this),
        afterrender: this.onAfterRender.bind(this),
        afterlayout: this.onAfterLayout.bind(this),
      },
    };
  },

  /**
   * Stage 1: Before render
   * - Load configuration
   * - Load required libraries
   * - Fetch initial data if needed
   */
  async onBeforeRender(component: any): Promise<void> {
    console.log('[TireManagementEF] Stage: beforerender');

    if (window.TireManagementEFInitialized) {
      console.log('[TireManagementEF] Already initialized, skipping');
      return;
    }

    try {
      // 1. Get tenant from EAM
      const tenant = EAMAdapter.getTenant();
      console.log('[TireManagementEF] Detected tenant:', tenant);

      // 2. Load tenant-specific config
      const config = await loadConfig(tenant);
      console.log('[TireManagementEF] Config loaded:', config);

      // 3. Load required libraries
      await this.loadLibraries(config);

      // 4. Mark as initialized
      window.TireManagementEFInitialized = true;

      // 5. Store config for Angular to access later
      window['TireManagementConfig'] = config;
    } catch (error) {
      console.error('[TireManagementEF] Initialization failed:', error);
    }
  },

  /**
   * Stage 2: After render
   * - Create mount point for Angular
   * - Inject Angular bootstrap markup
   */
  onAfterRender(component: any): void {
    console.log('[TireManagementEF] Stage: afterrender');

    // Create a container div for Angular to mount
    const containerId = 'tire-management-app';

    // Check if container already exists
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      component.getEl()?.appendChild(container);
    }

    // Mount Angular app
    this.mountAngularApp(containerId);
  },

  /**
   * Stage 3: After layout
   * - Adjust sizes if needed
   * - Final setup after full render
   */
  onAfterLayout(component: any): void {
    console.log('[TireManagementEF] Stage: afterlayout');

    // Allow Angular to resize itself if needed
    window.dispatchEvent(
      new CustomEvent('tire-management-ready', {
        detail: { component },
      }),
    );
  },

  /**
   * Load required libraries based on config
   * Uses singleton pattern to prevent re-loading
   */
  async loadLibraries(config: TenantConfig): Promise<void> {
    const libraries = config.libraries || [];

    for (const lib of libraries) {
      if (lib.type === 'js') {
        LibraryLoader.loadScript(lib.id, lib.url);
      } else if (lib.type === 'css') {
        LibraryLoader.loadStyle(lib.id, lib.url);
      }
    }

    // Wait for critical libraries to be ready
    if (config.features?.map?.enabled) {
      await LibraryLoader.waitForScript('openlayers');
    }
  },

  /**
   * Mount the Angular application into the container
   */
  mountAngularApp(containerId: string): void {
    const config = getConfig();

    if (config.angular?.standalone) {
      // For standalone Angular (Angular 15+), bootstrap manually
      import('../main').then((module) => {
        const { bootstrapApplication } = module;
        bootstrapApplication(config.angular?.rootComponent || 'app-root', {
          providers: [{ provide: 'TENANT_CONFIG', useValue: config }],
        }).catch((err) => console.error('[TireManagementEF] Angular bootstrap failed:', err));
      });
    } else {
      // Traditional Angular bootstrap via app.component
      console.log('[TireManagementEF] Mounting Angular app at #' + containerId);
      // Angular's bootstrap will find the element automatically
    }
  },
});
