import { Component, inject, signal } from '@angular/core';
import { LocalForm } from '../core/models/models';
import { AuthService } from '../core/services/auth.service';
import { DiretorioService } from '../core/services/diretorio.service';
import { LocaisService } from '../core/services/locais.service';
import { UiService } from '../core/services/ui.service';
import { LocalFormComponent } from '../shared/local-form';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-cadastro',
  imports: [Modal, LocalFormComponent],
  template: `
    <app-modal>
      <h2><i class="fas fa-plus-circle" style="color:var(--primary);"></i> Adicionar à Folha Amarela</h2>
      <p class="modal-lead">É gratuito. Você pode cadastrar seu próprio negócio ou indicar um estabelecimento/profissional que conhece.</p>
      <div class="status-pending"><i class="fas fa-shield-halved"></i> O cadastro será revisado antes de aparecer no diretório.</div>
      <app-local-form [inicial]="inicial" rotulo="Enviar para revisão"
                      [mensagem]="mensagem()" [ocupado]="ocupado()" (enviar)="salvar($event)" />
    </app-modal>
  `,
})
export class ModalCadastro {
  private readonly ui = inject(UiService);
  private readonly auth = inject(AuthService);
  private readonly locais = inject(LocaisService);
  private readonly diretorio = inject(DiretorioService);

  protected readonly mensagem = signal('');
  protected readonly ocupado = signal(false);

  protected readonly inicial: LocalForm = {
    nome: this.ui.cadastroNomeInicial(),
    categoria: this.ui.cadastroCategoriaInicial() || 'Alimentação',
    descricao: '', keywords: '', cep: '', endereco: '', bairro: '',
    cidade: this.diretorio.cidade(),
    horario: '', whatsapp: '', telefoneExtra: '', instagram: '',
  };

  protected async salvar(f: LocalForm) {
    this.ocupado.set(true);
    this.mensagem.set('Enviando...');
    try {
      await this.locais.criar(f, this.auth.user()?.uid ?? null);
      this.ui.fechar();
      alert('Cadastro enviado. Obrigado por ajudar a cidade!');
    } catch (e) {
      console.error(e);
      this.mensagem.set('Não foi possível enviar o cadastro.');
      this.ocupado.set(false);
    }
  }
}
