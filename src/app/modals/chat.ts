import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DiretorioService } from '../core/services/diretorio.service';
import { LocaisService } from '../core/services/locais.service';
import { CIDADE_PADRAO } from '../core/models/models';
import { combinaBusca, limparWhatsApp, normalizarTexto, registroAprovado } from '../core/utils/texto';
import { Modal } from '../shared/modal';

interface Msg { tipo: 'user' | 'bot'; texto: string; link?: string }

/** Busca conversacional simples, só no diretório (sem IA externa). */
@Component({
  selector: 'app-modal-chat',
  imports: [Modal, FormsModule],
  template: `
    <app-modal largura="450px">
      <div style="display:flex;flex-direction:column;height:480px;margin:-24px;">
        <div style="background:var(--purple);color:white;padding:16px 56px 16px 20px;border-radius:24px 24px 0 0;">
          <h3 style="font-size:16px;"><i class="fas fa-wand-magic-sparkles"></i> Busca conversacional</h3>
        </div>
        <div #caixa style="flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;background:var(--input-bg);">
          @for (m of mensagens(); track $index) {
            <div [style.background]="m.tipo === 'user' ? 'var(--purple)' : 'var(--surface)'"
                 [style.color]="m.tipo === 'user' ? 'white' : 'var(--dark)'"
                 [style.align-self]="m.tipo === 'user' ? 'flex-end' : 'flex-start'"
                 [style.border]="m.tipo === 'user' ? 'none' : '1px solid var(--border)'"
                 style="padding:10px 14px;border-radius:16px;max-width:85%;font-size:13px;line-height:1.5;">
              {{ m.texto }}
              @if (m.link) {
                <br><a [href]="m.link" target="_blank" rel="noopener noreferrer"
                       style="font-weight:800;display:inline-block;margin-top:7px;">Falar pelo WhatsApp</a>
              }
            </div>
          }
        </div>
        <div style="padding:12px;background:var(--surface);display:flex;gap:8px;border-radius:0 0 24px 24px;">
          <input type="search" class="form-control" placeholder="Ex.: preciso de eletricista" autocomplete="off"
                 style="margin:0;" [(ngModel)]="texto" (keydown.enter)="enviar()">
          <button class="btn-submit" style="margin:0;width:50px;background:var(--purple);color:white;" (click)="enviar()">
            <i class="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </app-modal>
  `,
})
export class ModalChat {
  private readonly locais = inject(LocaisService);
  private readonly diretorio = inject(DiretorioService);
  private readonly caixa = viewChild<ElementRef<HTMLElement>>('caixa');

  protected texto = '';
  protected readonly mensagens = signal<Msg[]>([
    { tipo: 'bot', texto: 'Descreva o que procura. Vou buscar nos estabelecimentos e serviços do diretório.' },
  ]);

  protected enviar() {
    const t = this.texto.trim();
    if (!t) return;
    this.texto = '';
    this.add({ tipo: 'user', texto: t });

    const cidade = this.diretorio.cidade();
    const achados = this.locais
      .locais()
      .filter(registroAprovado)
      .filter((l) => normalizarTexto(l.cidade || CIDADE_PADRAO) === normalizarTexto(cidade))
      .filter((l) => combinaBusca(l, t));

    if (achados.length) {
      const l = achados[0];
      const n = limparWhatsApp(l.whatsapp);
      this.add({
        tipo: 'bot',
        texto: `Encontrei ${achados.length} serviço(s). Ex: ${l.nome} (${l.categoria}), no ${l.bairro || 'Centro'}.`,
        link: n ? `https://wa.me/55${n}` : undefined,
      });
    } else {
      this.add({ tipo: 'bot', texto: `Não encontrei "${t}" em ${cidade}.` });
    }
  }

  private add(m: Msg) {
    this.mensagens.update((a) => [...a, m]);
    setTimeout(() => {
      const el = this.caixa()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }
}
