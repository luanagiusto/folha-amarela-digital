import { Component, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { DiretorioService } from '../core/services/diretorio.service';
import { ThemeService } from '../core/services/theme.service';
import { UiService } from '../core/services/ui.service';

@Component({
  selector: 'app-nav-drawer',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="nav-overlay" [class.open]="ui.menuAberto()" aria-hidden="true" (click)="ui.fecharMenu()"></div>

    <nav #nav id="menu-lateral" class="nav-drawer" [class.open]="ui.menuAberto()"
         role="dialog" aria-modal="true" aria-label="Menu principal"
         [attr.inert]="ui.menuAberto() ? null : ''" (keydown)="aoTeclar($event)">

      <div class="nav-header">
        <img [src]="theme.escuro() ? '/assets/header_dark.png' : '/assets/header_light.png'"
             alt="Folha Amarela Digital" (error)="$any($event.target).style.display = 'none'">
        <button #fechar class="btn-close-menu" type="button" aria-label="Fechar menu" (click)="ui.fecharMenu()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- CONTA -->
      <div class="conta">
        @if (auth.user(); as u) {
          <div class="conta-info">
            <i class="fas fa-user-circle"></i>
            <div>
              <strong>{{ nomeDe(u.displayName, u.email) }}</strong>
              <small>{{ auth.isAdmin() ? 'Administrador' : u.email }}</small>
            </div>
          </div>
          <button class="btn-conta primario" type="button" (click)="abrirPainel()">
            {{ auth.isAdmin() ? 'Painel Admin' : 'Meu painel' }}
          </button>
        } @else {
          <button class="btn-conta primario" type="button" (click)="entrar()">
            <i class="fas fa-right-to-bracket"></i> Entrar ou criar conta
          </button>
        }
      </div>

      <ul class="nav-links">
        <li class="nav-secao">Para quem procura</li>
        <li>
          <a routerLink="/" routerLinkActive="ativo" [routerLinkActiveOptions]="{ exact: true }" (click)="irInicio()">
            <i class="fas fa-home"></i> Início
          </a>
        </li>
        <li>
          <button class="link-style cidade-row" type="button" (click)="trocarCidade()">
            <i class="fas fa-location-dot"></i>
            <span class="cidade-txt"><small>Você está em</small><strong>{{ dir.cidade() }}</strong></span>
            <span class="trocar">trocar</span>
          </button>
        </li>
        <li class="cat-grid" role="group" aria-label="Categorias">
          @for (c of categorias; track c.nome) {
            <button type="button" class="cat-chip" [class.ativo]="dir.categoria() === c.valor"
                    [attr.aria-pressed]="dir.categoria() === c.valor" (click)="escolherCategoria(c.valor)">
              <i class="fas" [class]="c.icone"></i> {{ c.nome }}
            </button>
          }
        </li>
        <li>
          <button class="link-style" type="button" (click)="acao(() => ui.abrir('chat'))">
            <i class="fas fa-wand-magic-sparkles"></i> Busca por conversa
          </button>
        </li>
        <li>
          <button class="link-style" type="button" (click)="acao(() => ui.abrirIndicacao())">
            <i class="fas fa-user-plus"></i> Indicar alguém
          </button>
        </li>

        <li class="nav-secao">Para profissionais</li>
        <li>
          <button class="link-style" type="button" (click)="acao(() => ui.abrirCadastro())">
            <i class="fas fa-store"></i> Adicionar meu negócio
          </button>
        </li>
        <li>
          <a routerLink="/planos" routerLinkActive="ativo" (click)="ui.fecharMenu()">
            <i class="fas fa-certificate"></i> Planos e Selo Verificado
            <span class="badge-nav-novo">NOVO</span>
          </a>
        </li>
      </ul>

      <div class="nav-rodape">
        <div class="tema-seg" role="group" aria-label="Tema">
          <button type="button" [class.ativo]="!theme.escuro()" [attr.aria-pressed]="!theme.escuro()"
                  (click)="definirTema(false)"><i class="fas fa-sun"></i> Claro</button>
          <button type="button" [class.ativo]="theme.escuro()" [attr.aria-pressed]="theme.escuro()"
                  (click)="definirTema(true)"><i class="fas fa-moon"></i> Escuro</button>
        </div>
        @if (auth.user()) {
          <button class="btn-sair" type="button" (click)="sair()">
            <i class="fas fa-right-from-bracket"></i> Sair da conta
          </button>
        }
      </div>

    </nav>
  `,
  styles: `
    .nav-drawer { overflow: hidden; }
    .nav-header { padding: 14px 20px; }

    .conta { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
    .conta small { font-size: 12px; color: var(--gray); line-height: 1.4; }
    .conta-info { display: flex; align-items: center; gap: 12px; }
    .conta-info > i { font-size: 34px; color: var(--primary); }
    .conta-info strong { display: block; font-size: 15px; color: var(--dark); }
    .conta-info small { display: block; word-break: break-all; }
    .btn-conta {
      width: 100%; padding: 11px; border-radius: 12px; font-weight: 700; font-size: 14px;
      cursor: pointer; border: 1px solid var(--border); background: var(--input-bg); color: var(--dark);
    }
    .btn-conta.primario { background: var(--primary); border-color: var(--primary); color: #1E293B; }

    .nav-secao {
      padding: 14px 24px 6px; font-size: 11px; font-weight: 800; letter-spacing: .8px;
      text-transform: uppercase; color: var(--gray); margin: 0;
    }
    .nav-links a.ativo, .nav-links button.ativo {
      background: rgba(245, 158, 11, 0.12); color: var(--primary-hover);
    }
    .nav-links a.ativo i, .nav-links button.ativo i { color: var(--primary); }

    .nav-links a, .nav-links button.link-style { padding-top: 11px; padding-bottom: 11px; }

    .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 4px 20px 8px; }
    .cat-chip {
      display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 12px;
      border: 1px solid var(--border); background: var(--input-bg); color: var(--dark);
      font-weight: 600; font-size: 14px; cursor: pointer;
    }
    .cat-chip i { color: var(--gray); width: 16px; text-align: center; }
    .cat-chip.ativo { background: rgba(245, 158, 11, 0.12); border-color: var(--primary); color: var(--primary-hover); }
    .cat-chip.ativo i { color: var(--primary); }

    .cidade-row { align-items: center; }
    .cidade-txt { display: flex; flex-direction: column; flex: 1; text-align: left; line-height: 1.25; }
    .cidade-txt small { font-size: 11px; font-weight: 600; color: var(--gray); }
    .cidade-txt strong { font-size: 15px; }
    .trocar { font-size: 12px; font-weight: 700; color: var(--primary-hover); }

    .nav-rodape { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px; }
    .tema-seg { display: flex; background: var(--input-bg); border-radius: 12px; padding: 3px; }
    .tema-seg button {
      flex: 1; border: none; background: transparent; padding: 8px; border-radius: 10px;
      font-weight: 700; font-size: 13px; color: var(--gray); cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .tema-seg button.ativo { background: var(--surface); color: var(--dark); box-shadow: var(--shadow); }
    .btn-sair {
      border: none; background: transparent; color: var(--danger); font-weight: 700;
      font-size: 14px; padding: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
  `,
})
export class NavDrawer {
  protected readonly ui = inject(UiService);
  protected readonly theme = inject(ThemeService);
  protected readonly auth = inject(AuthService);
  protected readonly dir = inject(DiretorioService);
  private readonly router = inject(Router);

  private readonly nav = viewChild<ElementRef<HTMLElement>>('nav');
  private readonly botaoFechar = viewChild<ElementRef<HTMLElement>>('fechar');
  private jaAbriu = false;

  protected readonly categorias = [
    { valor: 'Alimentação', nome: 'Alimentação', icone: 'fa-hamburger' },
    { valor: 'Serviços', nome: 'Serviços', icone: 'fa-tools' },
    { valor: 'Pet Shop', nome: 'Pets', icone: 'fa-paw' },
    { valor: 'Saúde', nome: 'Saúde', icone: 'fa-pills' },
  ];

  constructor() {
    // Trava a rolagem da página e cuida do foco enquanto o menu está aberto
    effect(() => {
      const aberto = this.ui.menuAberto();
      document.body.style.overflow = aberto ? 'hidden' : '';
      if (aberto) {
        this.jaAbriu = true;
        setTimeout(() => this.botaoFechar()?.nativeElement.focus(), 50);
      } else if (this.jaAbriu) {
        (document.querySelector('.btn-menu') as HTMLElement | null)?.focus();
      }
    });
  }

  @HostListener('document:keydown.escape')
  protected aoEsc() {
    if (this.ui.menuAberto()) this.ui.fecharMenu();
  }

  /** Mantém o Tab dentro do menu enquanto ele está aberto. */
  protected aoTeclar(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;
    const itens = Array.from(
      this.nav()?.nativeElement.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
    );
    if (!itens.length) return;
    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  protected nomeDe(displayName: string | null, email: string | null): string {
    return displayName || email?.split('@')[0] || 'Minha conta';
  }

  /** Fecha o menu e executa a ação (abrir um modal, por exemplo). */
  protected acao(fn: () => void) {
    this.ui.fecharMenu();
    fn();
  }

  protected irInicio() {
    this.dir.limparFiltros();
    this.ui.fecharMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected trocarCidade() {
    this.acao(() => this.ui.abrir('cidade'));
  }

  /** Toque na categoria aplica o filtro; tocar de novo na ativa volta para todas. */
  protected escolherCategoria(valor: string) {
    this.dir.setCategoria(this.dir.categoria() === valor ? '' : valor);
    this.ui.fecharMenu();
    const rolar = () =>
      setTimeout(() => document.querySelector('.categorias')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    if (this.router.url.split('?')[0] !== '/') this.router.navigateByUrl('/').then(rolar);
    else rolar();
  }

  protected entrar() {
    this.acao(() => this.ui.abrir('acesso'));
  }

  protected abrirPainel() {
    this.acao(() => this.ui.abrir('painel'));
  }

  protected definirTema(escuro: boolean) {
    if (this.theme.escuro() !== escuro) this.theme.alternar();
  }

  protected async sair() {
    this.ui.fecharMenu();
    try {
      await this.auth.sair();
    } catch (e) {
      console.error('Erro ao sair:', e);
      alert('Erro ao sair da conta.');
    }
  }
}
