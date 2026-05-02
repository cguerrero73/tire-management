import { Component, ChangeDetectionStrategy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../core/services/config.service';
import { ApiService, ApiError } from '../core/services/api.service';
import { isPlatformBrowser } from '@angular/common';

const apiService = ApiService;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  eamId = 'not set';
  tenantId = 'not set';
  language = 'not set';
  systemFunction = 'not set';
  parentUrl = 'not set';
  environment = 'not set';
  apiBase = 'not set';
  loading = false;
  error = '';
  apiResponse = '';

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
      const params = new URLSearchParams(window.location.search);
      this.parentUrl = params.get('parentUrl') || 'not set';
    }
  }

  async makeApiCall() {
    this.loading = true;
    this.error = '';
    this.apiResponse = '';

    try {
      const response = await apiService.get('TESTFUNCTION.LST', { pageaction: 'GETDATA' });
      this.apiResponse = JSON.stringify(response.data, null, 2);
    } catch (err) {
      if (err instanceof ApiError) {
        this.error = `Error ${err.status}: ${err.message}`;
      } else {
        this.error = 'Unknown error';
      }
    } finally {
      this.loading = false;
    }
  }
}
