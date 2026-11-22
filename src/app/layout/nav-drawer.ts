import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { UiService } from '../core/services/ui.service';

@Component({
  selector: 'app-nav-drawer',
  imports: [RouterLink],
  template: `
    <div class="nav-overlay" [class.open]="ui.menuAberto()" (click)="ui.fecharMenu()"></div>
    <nav class="nav-drawer" [class.open]="ui.menuAberto()">
      <div class="nav-header">
        <img [src]="theme.escuro() ? '/assets/header_dark.png' : '/assets/header_light.png'"
     alt="Folha Amarela Digital" (error)="$any($event.target).style.display = 'none'">
        <button class="btn-close-menu" (click)="ui.fecharMenu()"><i class="fas fa-times"></i></button>
      </div>

      <ul class="nav-links">
        <li>
          <a routerLink="/" (click)="ui.fecharMenu()"><i class="fas fa-home"></i> Início</a>
        </li>
        <li>
          <a routerLink="/planos" (click)="ui.fecharMenu()">
            <i class="fas fa-certificate"></i> Seja Verificado
            <span class="badge-nav-novo">NOVO</span>
          </a>
        </li>
        <li>
          <button class="link-style" (click)="ui.fecharMenu(); ui.abrir('escolhaAnuncio')">
            <i class="fas fa-store"></i> Adicionar Negócio
          </button>
        </li>
        <li>
          <button class="link-style" (click)="abrirAcesso()">
            <i class="fas fa-user-circle"></i> Área de Lojistas
          </button>
        </li>
        <li style="border-top: 1px solid var(--border); margin-top: 12px; padding-top: 12px;">
          <button class="link-style" (click)="ui.fecharMenu(); theme.alternar()">
            <i class="fas" [class.fa-sun]="theme.escuro()" [class.fa-moon]="!theme.escuro()"></i> Alternar Tema
          </button>
        </li>
      </ul>

      <div class="nav-footer">Folha Amarela Digital &copy; 2026</div>
    </nav>
  `,
})
export class NavDrawer {
  protected readonly ui = inject(UiService);
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);

  protected abrirAcesso() {
    this.ui.fecharMenu();
    this.ui.abrir(this.auth.user() ? 'painel' : 'acesso');
  }
}
