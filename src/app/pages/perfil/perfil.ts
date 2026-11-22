import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { Local } from '../../core/models/models';
import { LocaisService } from '../../core/services/locais.service';
import { CIDADE_PADRAO } from '../../core/models/models';
import {
  abrirWhatsApp, linkInstagram, linkMapa, nomeExibicaoLocal, registroDestaque,
} from '../../core/utils/texto';

type Estado = 'carregando' | 'ok' | 'erro';

@Component({
  selector: 'app-perfil',
  imports: [RouterLink],
  templateUrl: './perfil.html',
})
export class Perfil {
  private readonly locais = inject(LocaisService);
  private readonly titulo = inject(Title);

  /** Vem da rota /perfil/:id (withComponentInputBinding). */
  readonly id = input<string>();

  protected readonly estado = signal<Estado>('carregando');
  protected readonly local = signal<Local | null>(null);

  protected readonly nome = computed(() => (this.local() ? nomeExibicaoLocal(this.local()!) : ''));
  protected readonly destaque = computed(() => (this.local() ? registroDestaque(this.local()!) : false));
  protected readonly enderecoTexto = computed(() => {
    const l = this.local();
    if (!l) return '';
    const cidade = l.cidade || CIDADE_PADRAO;
    return l.endereco
      ? `${l.endereco} - ${l.bairro || 'Centro'}, ${cidade}`
      : `${l.bairro || 'Centro'}, ${cidade}`;
  });
  protected readonly mapa = computed(() => (this.local() ? linkMapa(this.local()!, CIDADE_PADRAO) : ''));
  protected readonly instagram = computed(() =>
    this.local()?.instagram ? linkInstagram(this.local()!.instagram!) : '',
  );

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return this.estado.set('erro');
      this.estado.set('carregando');
      this.locais
        .obterPorId(id)
        .then((l) => {
          this.local.set(l);
          this.estado.set(l ? 'ok' : 'erro');
          if (l) this.titulo.setTitle(`${nomeExibicaoLocal(l)} - Folha Amarela Digital`);
        })
        .catch((e) => {
          console.error('Erro ao carregar perfil:', e);
          this.estado.set('erro');
        });
    });
  }

  protected whatsapp() {
    const l = this.local()!;
    abrirWhatsApp(l.whatsapp || l.telefone, `Olá! Vi *${this.nome()}* na Folha Amarela Digital e gostaria de mais informações.`);
  }
}
