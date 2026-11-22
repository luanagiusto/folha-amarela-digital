import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly escuro = signal(localStorage.getItem('folha_theme') === 'dark');

  constructor() {
    effect(() => {
      const dark = this.escuro();
      document.body.classList.toggle('dark-mode', dark);
      localStorage.setItem('folha_theme', dark ? 'dark' : 'light');
    });
  }

  alternar() {
    this.escuro.update((v) => !v);
  }
}
