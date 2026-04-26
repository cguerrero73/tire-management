import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

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
      </header>
      <main class="tire-content">
        <p>Módulo Tire Management para HxGN EAM</p>
        <p>Versión embebida — desarrollo en curso</p>
      </main>
    </div>
  `,
  styles: [`
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
    }
    .tire-header h1 {
      margin: 0;
      font-size: 1.25rem;
    }
    .tire-content {
      padding: 2rem;
      text-align: center;
      color: #666;
    }
  `]
})
export class App {}