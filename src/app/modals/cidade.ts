import { Component, computed, inject, signal } from '@angular/core';
import { CIDADE_PADRAO } from '../core/models/models';
import { DiretorioService } from '../core/services/diretorio.service';
import { ExternoService } from '../core/services/externo.service';
import { LocaisService } from '../core/services/locais.service';
import { UiService } from '../core/services/ui.service';
import { normalizarTexto, registroAprovado } from '../core/utils/texto';
import { Modal } from '../shared/modal';

interface CidadeItem { nome: string; total: number }

@Component({
  selector: 'app-modal-cidade',
  imports: [Modal],
  template: `
    <app-modal largura="420px">
      <div class="topo">
        <div class="pino"><i class="fas fa-map-marker-alt"></i></div>
        <h2>Qual é a sua cidade?</h2>
      </div>

      <button type="button" class="btn-gps" [disabled]="buscandoGps()" (click)="usarGps()">
        @if (buscandoGps()) {
          <i class="fas fa-spinner fa-spin"></i> Procurando...
        } @else {
          <i class="fas fa-location-arrow"></i> Usar minha localização
        }
      </button>
      <p class="dica" [class.erro]="!!erroGps()" role="status">
        {{ erroGps() || 'Usada só para descobrir a cidade.' }}
      </p>

      @if (cidades().length) {
        <div class="ou"><span>ou escolha</span></div>
        <select class="seletor" aria-label="Escolha a cidade" (change)="escolher($any($event.target).value)">
          <option value="" selected disabled>Escolha a cidade…</option>
          @for (c of cidades(); track c.nome) {
            <option [value]="c.nome">{{ c.nome }} ({{ c.total }})</option>
          }
        </select>
      }

      <div class="ajuda">
        <p>
          <span>
            @if (cidadeDetectada(); as c) {
              Ainda não temos profissionais em <strong>{{ c }}</strong>. Ajude a abrir a cidade:
            } @else {
              Não achou a sua cidade? Ajude a começar por ela:
            }
          </span>
        </p>
        <div class="acoes">
          <button type="button" (click)="indicar()"><i class="fas fa-user-plus"></i> Indicar alguém</button>
          <button type="button" (click)="cadastrar()"><i class="fas fa-store"></i> Adicionar meu negócio</button>
        </div>
      </div>
    </app-modal>
  `,
  styles: `
    .topo { text-align: center; padding: 4px 0 16px; }
    .pino {
      width: 48px; height: 48px; margin: 0 auto 10px; border-radius: 50%;
      background: rgba(245, 158, 11, 0.15); color: var(--primary);
      display: flex; align-items: center; justify-content: center; font-size: 20px;
    }
    .topo h2 { font-size: 22px; font-weight: 800; color: var(--dark); }

    .btn-gps {
      width: 100%; height: 52px; border: none; border-radius: 14px; cursor: pointer;
      background: var(--primary); color: #1E293B; font-weight: 800; font-size: 15px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
    }
    .btn-gps:disabled { opacity: .7; cursor: default; }
    .dica { margin: 8px 0 0; text-align: center; font-size: 12px; color: var(--gray); line-height: 1.4; min-height: 17px; }
    .dica.erro { color: var(--danger); }

    .ou { display: flex; align-items: center; margin: 18px 0 12px; color: var(--gray); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .ou::before, .ou::after { content: ''; flex: 1; border-top: 1px solid var(--border); }
    .ou span { padding: 0 12px; }

    .seletor {
      width: 100%; height: 48px; padding: 0 14px; border-radius: 12px; font-size: 15px; cursor: pointer;
      border: 1px solid var(--border); background: var(--input-bg); color: var(--dark);
    }
    .seletor:focus { outline: none; border-color: var(--primary); }
    .seletor option { background: var(--surface); color: var(--dark); }

    .ajuda { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--border); }
    .ajuda p {
      font-size: 13px; color: var(--gray); line-height: 1.5; margin: 0 0 10px; text-align: center;
      min-height: 39px; display: flex; align-items: center; justify-content: center; /* não pula de altura */
    }
    .ajuda strong { color: var(--dark); }
    .acoes { display: flex; gap: 8px; }
    .acoes button {
      flex: 1; padding: 11px 8px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer;
      border: 1px solid var(--border); background: var(--surface); color: var(--dark);
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .acoes button i { color: var(--primary); }
  `,
})
export class ModalCidade {
  private readonly dir = inject(DiretorioService);
  private readonly ui = inject(UiService);
  private readonly externo = inject(ExternoService);
  private readonly locais = inject(LocaisService);

  protected readonly buscandoGps = signal(false);
  protected readonly erroGps = signal('');
  /** Cidade achada pelo GPS que ainda não tem nenhum cadastro. */
  protected readonly cidadeDetectada = signal<string | null>(null);

  /** Só as cidades que já têm pelo menos 1 cadastro aprovado. */
  protected readonly cidades = computed<CidadeItem[]>(() => {
    const mapa = new Map<string, CidadeItem>();
    for (const l of this.locais.locais()) {
      if (!registroAprovado(l)) continue;
      const nome = (l.cidade || CIDADE_PADRAO).trim();
      const chave = normalizarTexto(nome);
      const item = mapa.get(chave) ?? { nome, total: 0 };
      item.total++;
      mapa.set(chave, item);
    }
    return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  });

  protected escolher(nome: string) {
    if (!nome) return;
    this.dir.mudarCidade(nome);
    this.ui.fechar();
  }

  /** Se a cidade veio do GPS, ela vira a cidade atual antes de abrir o formulário. */
  private usarCidadeDetectada() {
    const c = this.cidadeDetectada();
    if (c) this.dir.mudarCidade(c);
  }

  protected indicar() {
    this.usarCidadeDetectada();
    this.ui.abrirIndicacao();
  }

  protected cadastrar() {
    this.usarCidadeDetectada();
    this.ui.abrirCadastro();
  }

  protected async usarGps() {
    this.erroGps.set('');
    this.cidadeDetectada.set(null);
    if (!navigator.geolocation) {
      return this.erroGps.set('O seu navegador não permite usar a localização.');
    }
    this.buscandoGps.set(true);
    try {
      const encontrada = await this.externo.cidadePorGps();
      if (!encontrada) return this.erroGps.set('Não foi possível identificar a sua cidade.');
      const existente = this.cidades().find((c) => normalizarTexto(c.nome) === normalizarTexto(encontrada));
      if (existente) return this.escolher(existente.nome);
      this.cidadeDetectada.set(encontrada);
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      if (!code) console.error(e);
      this.erroGps.set(
        code === 1 ? 'Permissão negada. Libere a localização no navegador ou escolha abaixo.'
        : code === 2 ? 'Sinal de localização indisponível agora.'
        : code === 3 ? 'Tempo esgotado ao buscar a localização.'
        : 'Não foi possível consultar a localização agora.',
      );
    } finally {
      this.buscandoGps.set(false);
    }
  }
}
