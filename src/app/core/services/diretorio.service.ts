import { Injectable, computed, inject, signal } from '@angular/core';
import { CIDADE_PADRAO, Local } from '../models/models';
import { combinaBusca, normalizarTexto, registroAprovado, registroDestaque } from '../utils/texto';
import { LocaisService } from './locais.service';

export const ITENS_POR_PAGINA = 20;

/** Estado dos filtros da home (cidade, categoria, bairro, busca, página). */
@Injectable({ providedIn: 'root' })
export class DiretorioService {
  private readonly locaisSvc = inject(LocaisService);

  readonly cidade = signal(CIDADE_PADRAO);
  readonly categoria = signal('');
  readonly bairro = signal('');
  readonly busca = signal('');
  readonly pagina = signal(1);

  readonly cidades = computed(() =>
    [...new Set(this.locaisSvc.locais().map((x) => (x.cidade || CIDADE_PADRAO).trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR')),
  );

  readonly bairros = computed(() => {
    const cidade = normalizarTexto(this.cidade());
    return [
      ...new Set(
        this.locaisSvc
          .locais()
          .filter((x) => normalizarTexto(x.cidade || CIDADE_PADRAO) === cidade && x.bairro)
          .map((x) => String(x.bairro).trim())
          .filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  });

  readonly filtrados = computed<Local[]>(() => {
    const cidade = normalizarTexto(this.cidade());
    const cat = normalizarTexto(this.categoria());
    const bairro = normalizarTexto(this.bairro());
    const q = this.busca().trim();

    let a = this.locaisSvc
      .locais()
      .filter(registroAprovado)
      .filter((l) => normalizarTexto(l.cidade || CIDADE_PADRAO) === cidade);
    if (cat) a = a.filter((l) => normalizarTexto(l.categoria) === cat);
    if (bairro) a = a.filter((l) => normalizarTexto(l.bairro) === bairro);
    if (q) a = a.filter((l) => combinaBusca(l, q));
    // Destaques primeiro (sort estável preserva a ordem do resto)
    return [...a].sort((x, y) => Number(registroDestaque(y)) - Number(registroDestaque(x)));
  });

  readonly totalPaginas = computed(() => Math.ceil(this.filtrados().length / ITENS_POR_PAGINA));

  readonly paginados = computed(() => {
    const ini = (this.pagina() - 1) * ITENS_POR_PAGINA;
    return this.filtrados().slice(ini, ini + ITENS_POR_PAGINA);
  });

  mudarCidade(c: string) {
    this.cidade.set(c);
    this.bairro.set('');
    this.pagina.set(1);
  }

  setCategoria(c: string) {
    this.categoria.set(c);
    this.pagina.set(1);
  }

  setBairro(b: string) {
    this.bairro.set(b);
    this.pagina.set(1);
  }

  setBusca(q: string) {
    this.busca.set(q);
    this.pagina.set(1);
  }

  irParaPagina(p: number) {
    this.pagina.set(p);
  }

  /** Equivalente ao antigo voltarInicio(): limpa filtros, mantém a cidade. */
  limparFiltros() {
    this.categoria.set('');
    this.bairro.set('');
    this.busca.set('');
    this.pagina.set(1);
  }
}
