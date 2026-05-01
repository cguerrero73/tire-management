import { Component, ChangeDetectionStrategy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantConfig } from '../core/models/tenant-config.model';
import { ConfigService } from '../core/services/config.service';
import { isPlatformBrowser } from '@angular/common';

// Placeholder minimal — el contenido real va en features/pages
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tire-module">
      <header class="tire-header">
        <h1>Gestión de Neumáticos</h1>
        <span class="tenant-badge">{{ tenantId }}</span>
      </header>
      <main class="tire-content">
        <p>Módulo Tire Management para HxGN EAM XXXX</p>
        <p>
          Tenant: <strong>{{ tenantId }}</strong> | Env: <strong>{{ environment }}</strong>
        </p>
        <p>Feature flags: {{ featureFlags | json }}</p>
        <p>
          API Base: <code>{{ apiBase }}</code>
        </p>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .tire-module {
        height: 100%;
        font-family: Arial, sans-serif;
      }
      .tire-header {
        background: #1a1a2e;
        color: white;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .tire-header h1 {
        margin: 0;
        font-size: 1.25rem;
      }
      .tenant-badge {
        background: #4a4a6a;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        text-transform: uppercase;
      }
      .tire-content {
        padding: 2rem;
        text-align: center;
        color: #666;
      }
      .tire-content code {
        background: #f0f0f0;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-size: 0.85em;
      }
    `,
  ],
})
export class App {
  tenantId = 'loading...';
  environment = 'loading...';
  apiBase = 'loading...';
  featureFlags = {};

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadConfig();
  }

  private loadConfig(): void {
    if (isPlatformBrowser(this.platformId)) {
      const config = ConfigService.get();
      this.tenantId = config.tenant;
      this.environment = config.environment;
      this.apiBase = config.api.baseUrl;
      this.featureFlags = config.features || {};
    }
  }
}
