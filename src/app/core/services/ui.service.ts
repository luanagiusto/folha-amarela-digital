import { Injectable, signal } from '@angular/core';
import { Local } from '../models/models';

export type ModalNome =
  | 'escolhaAnuncio'
  | 'cadastro'
  | 'cidade'
  | 'acesso'
  | 'painel'
  | 'editarPerfil'
  | 'detalhes'
  | 'destaque'
  | 'indicacao'
  | 'chat';

/** Controla o menu lateral e qual modal está aberto (um por vez, como no site atual). */
@Injectable({ providedIn: 'root' })
export class UiService {
  readonly menuAberto = signal(false);
  readonly modal = signal<ModalNome | null>(null);

  /** Dados de apoio dos modais */
  readonly localAtual = signal<Local | null>(null);
  readonly cadastroNomeInicial = signal('');
  readonly cadastroCategoriaInicial = signal('');
  readonly indicacaoTermo = signal('');

  alternarMenu() {
    this.menuAberto.update((v) => !v);
  }

  fecharMenu() {
    this.menuAberto.set(false);
  }

  abrir(nome: ModalNome) {
    this.modal.set(nome);
  }

  fechar() {
    this.modal.set(null);
  }

  abrirDetalhes(l: Local) {
    this.localAtual.set(l);
    this.modal.set('detalhes');
  }

  abrirCadastro(nome = '', categoria = '') {
    this.cadastroNomeInicial.set(nome);
    this.cadastroCategoriaInicial.set(categoria);
    this.modal.set('cadastro');
  }

  abrirIndicacao(termo = '') {
    this.indicacaoTermo.set(termo);
    this.modal.set('indicacao');
  }
}
