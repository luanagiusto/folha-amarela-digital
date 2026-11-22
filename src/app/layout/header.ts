import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { DiretorioService } from '../core/services/diretorio.service';
import { ThemeService } from '../core/services/theme.service';
import { UiService } from '../core/services/ui.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header class="site-header">
      <div class="header-inner">
        <button class="btn-menu" (click)="ui.alternarMenu()" aria-label="Abrir menu">
          <i class="fas fa-bars"></i>
        </button>

        <a routerLink="/" class="logo-wrap" (click)="aoClicarLogo()">
          @if (!logoQuebrada) {
            <img [src]="theme.escuro() ? 'header_dark.png' : 'header_light.png'"
                 alt="Folha Amarela Digital" (error)="logoQuebrada = true">
          } @else {
            <span class="logo-fallback" style="display:flex">
              <span class="logo-fallback-mark"><i class="fas fa-book-open"></i></span>
              <span class="logo-fallback-text">Folha Amarela<small>Digital</small></span>
            </span>
          }
        </a>

        <div class="header-actions">
          <button class="btn-lojista-nav" (click)="abrirAcesso()">
            <i class="fas fa-user-circle"></i> <span>{{ rotuloAcesso() }}</span>
          </button>
          <button class="btn-theme-toggle" (click)="theme.alternar()" title="Alternar Modo Escuro/Claro">
            <i class="fas" [class.fa-sun]="theme.escuro()" [class.fa-moon]="!theme.escuro()"></i>
          </button>
          <button class="btn-anunciar" (click)="ui.abrir('escolhaAnuncio')">
            <i class="fas fa-plus"></i> <span>Adicionar negócio</span>
          </button>
        </div>
      </div>
    </header>
  `,
})
export class Header {
  protected readonly ui = inject(UiService);
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly diretorio = inject(DiretorioService);
  private readonly router = inject(Router);

  protected logoQuebrada = false;

  protected readonly rotuloAcesso = computed(() => {
    if (!this.auth.user()) return 'Área de acesso';
    return this.auth.isAdmin() ? 'Painel Admin' : 'O Meu Painel';
  });

  protected abrirAcesso() {
    this.ui.abrir(this.auth.user() ? 'painel' : 'acesso');
  }

  protected aoClicarLogo() {
    this.diretorio.limparFiltros();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
