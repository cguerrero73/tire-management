import { Component, ChangeDetectionStrategy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../core/services/config.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  // From URL params (passed from EAM via EF iframe)
  eamId = 'not set';
  tenantId = 'not set';
  language = 'not set';
  systemFunction = 'not set';

  // Parent window URL (EAM origin)
  parentUrl = 'not in iframe';

  // From config
  environment = 'not set';
  apiBase = 'not set';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadConfig();
    this.loadUrlParams();
    this.loadParentUrl();
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
    }
  }

  private loadParentUrl(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (window.parent !== window) {
        try {
          this.parentUrl = window.parent.location.origin;
        } catch (e) {
          console.log(e);
          this.parentUrl = 'blocked by cross-origin';
        }
      }
    }
  }
}
