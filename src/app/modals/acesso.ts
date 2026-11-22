import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { UiService } from '../core/services/ui.service';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-acesso',
  imports: [Modal, FormsModule],
  template: `
    <app-modal largura="380px">
      <div style="text-align:center;">
        <h2>{{ criando() ? 'Criar acesso' : 'Área de Acesso' }}</h2>
        <p style="color:var(--gray);font-size:13px;line-height:1.5;margin-bottom:16px;">
          {{ criando() ? 'Crie uma conta.' : 'Entre para acompanhar seus cadastros e reivindicações.' }}
        </p>
      </div>
      <div class="form-group">
        <label>E-mail</label>
        <input type="email" class="form-control" placeholder="seu@email.com" autocomplete="email" [(ngModel)]="email">
      </div>
      <div class="form-group">
        <label>Palavra-passe</label>
        <input type="password" class="form-control" placeholder="Mínimo de 6 caracteres"
               [attr.autocomplete]="criando() ? 'new-password' : 'current-password'"
               [(ngModel)]="senha" (keydown.enter)="enviar()">
      </div>
      <div class="helper-text" style="min-height:18px;">{{ mensagem() }}</div>
      <button class="btn-submit" (click)="enviar()">{{ criando() ? 'Criar conta' : 'Entrar' }}</button>
      <button class="btn-card btn-secondary" style="width:100%;margin-top:10px;" (click)="criando.set(!criando()); mensagem.set('')">
        {{ criando() ? 'Já tenho conta' : 'Criar meu acesso' }}
      </button>
    </app-modal>
  `,
})
export class ModalAcesso {
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UiService);

  protected email = '';
  protected senha = '';
  protected readonly criando = signal(false);
  protected readonly mensagem = signal('');

  protected async enviar() {
    const email = this.email.trim();
    if (!email || !this.senha) return this.mensagem.set('Informe e-mail e palavra-passe.');
    if (this.criando() && this.senha.length < 6) return this.mensagem.set('Mínimo 6 caracteres.');
    this.mensagem.set('Aguarde...');
    try {
      if (this.criando()) await this.auth.criarConta(email, this.senha);
      else await this.auth.entrar(email, this.senha);
      this.mensagem.set('Sucesso.');
      setTimeout(() => this.ui.fechar(), 400);
    } catch (e) {
      console.error(e);
      this.mensagem.set('Falha ao acessar. Verifique seus dados.');
    }
  }
}
