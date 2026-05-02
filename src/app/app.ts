import { Component, ChangeDetectionStrategy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../core/services/config.service';
import { isPlatformBrowser } from '@angular/common';

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
        <h2>Session Data from EAM</h2>
        <div class="session-data">
          <div class="data-row">
            <span class="label">Tenant:</span>
            <span class="value">{{ tenantId }}</span>
          </div>
          <div class="data-row">
            <span class="label">EAM ID:</span>
            <span class="value">{{ eamId }}</span>
          </div>
          <div class="data-row">
            <span class="label">Language:</span>
            <span class="value">{{ language }}</span>
          </div>
          <div class="data-row">
            <span class="label">System Function:</span>
            <span class="value">{{ systemFunction }}</span>
          </div>
        </div>

        <h3>Config Data</h3>
        <div class="session-data">
          <div class="data-row">
            <span class="label">Env:</span>
            <span class="value">{{ environment }}</span>
          </div>
          <div class="data-row">
            <span class="label">API Base:</span>
            <span class="value"
              ><code>{{ apiBase }}</code></span
            >
          </div>
        </div>
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
        color: #666;
      }
      .tire-content h2 {
        margin-top: 0;
        color: #333;
      }
      .tire-content h3 {
        margin-top: 1.5rem;
        color: #333;
      }
      .session-data {
        background: #f5f5f5;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      .data-row {
        display: flex;
        padding: 0.5rem 0;
        border-bottom: 1px solid #ddd;
      }
      .data-row:last-child {
        border-bottom: none;
      }
      .label {
        font-weight: bold;
        width: 150px;
        color: #555;
      }
      .value {
        color: #333;
      }
      code {
        background: #e0e0e0;
        padding: 0.2rem 0.4rem;
        border-radius: 3px;
        font-size: 0.85em;
      }
    `,
  ],
})
export class App {
  // From URL params (passed from EAM via EF iframe)
  eamId = 'not set';
  tenantId = 'not set';
  language = 'not set';
  systemFunction = 'not set';

  // From config
  environment = 'not set';
  apiBase = 'not set';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadConfig();
    this.loadUrlParams();
  }

  private loadConfig(): void {
    if (isPlatformBrowser(this.platformId)) {
      const config = ConfigService.get();
      this.tenantId = config.tenant;
      this.environment = config.environment;
      this.apiBase = config.api.baseUrl;
    }
  }

  private loadUrlParams(): void {
    if (isPlatformBrowser(this.platformId)) {
      const params = new URLSearchParams(window.location.search);
      this.eamId = params.get('eamid') || 'not set';
      this.tenantId = params.get('tenant') || 'not set';
      this.language = params.get('lang') || 'not set';
      this.systemFunction = params.get('sysfunc') || 'not set';

      console.log('[App] EAM session params loaded:', {
        eamId: this.eamId,
        tenantId: this.tenantId,
        language: this.language,
        systemFunction: this.systemFunction,
      });
    }
  }
}
