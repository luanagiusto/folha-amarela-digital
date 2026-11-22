import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Unsubscribe } from 'firebase/firestore';
import { InteresseDestaque, Local, Reivindicacao } from '../core/models/models';
import { AuthService } from '../core/services/auth.service';
import { LocaisService } from '../core/services/locais.service';
import { SolicitacoesService } from '../core/services/solicitacoes.service';
import { UiService } from '../core/services/ui.service';
import { registroDestaque } from '../core/utils/texto';
import { Modal } from '../shared/modal';

@Component({
  selector: 'app-modal-painel',
  imports: [Modal],
  template: `
    <app-modal largura="620px">
      @if (auth.isAdmin()) {
        <h2 style="font-size:21px;"><i class="fas fa-shield-halved" style="color:var(--primary);"></i> Painel Admin</h2>
      } @else {
        <h2 style="font-size:21px;"><i class="fas fa-user-circle" style="color:var(--primary);"></i> Meu painel</h2>
      }
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px;">
        <p class="modal-lead" style="margin:0;">
          {{ auth.isAdmin() ? 'Aprove reivindicações e pedidos de destaque.' : 'Conta: ' + (auth.user()?.email ?? '') }}
        </p>
        <button type="button" class="btn-outline btn-card" style="padding:9px 13px;border-radius:10px;font-weight:800;white-space:nowrap;"
                (click)="sair()"><i class="fas fa-right-from-bracket"></i> Sair da conta</button>
      </div>

      @if (auth.isAdmin()) {
        <div class="panel-grid">
          <div class="panel-stat"><span>Reivindicações</span><strong>{{ pendentesReiv().length }}</strong></div>
          <div class="panel-stat"><span>Pedidos destaque</span><strong>{{ novosInteresses().length }}</strong></div>
          <div class="panel-stat"><span>Perfis gestão</span><strong>{{ meusLocais().length }}</strong></div>
        </div>

        <h3 style="margin-top:18px;">Reivindicações</h3>
        <div class="panel-list">
          @for (r of pendentesReiv(); track r.idDoc) {
            <div class="panel-item">
              <div class="panel-item-title">{{ r.nomeLocal || 'Perfil' }}</div>
              <div class="panel-item-meta">{{ r.email || 'Sem e-mail' }} • {{ r.userId || '—' }}</div>
              <div class="panel-actions">
                <button class="tiny-btn" (click)="aprovarReiv(r)">Aprovar</button>
                <button class="tiny-btn danger-btn" (click)="recusarReiv(r)">Recusar</button>
              </div>
            </div>
          } @empty { <div class="admin-note">Nenhuma reivindicação.</div> }
        </div>

        <h3 style="margin-top:18px;">Pedidos destaque</h3>
        <div class="panel-list">
          @for (r of novosInteresses(); track r.idDoc) {
            <div class="panel-item">
              <div class="panel-item-title">{{ r.nomeLocal || 'Perfil' }}</div>
              <div class="panel-item-meta">{{ r.email }} @if (r.whatsapp) { • {{ r.whatsapp }} }</div>
              <div class="panel-actions">
                <button class="tiny-btn" (click)="ativar(r)">Ativar</button>
                <button class="tiny-btn danger-btn" (click)="recusarDest(r)">Recusar</button>
              </div>
            </div>
          } @empty { <div class="admin-note">Nenhum pedido.</div> }
        </div>
      } @else {
        <div class="panel-tabs">
          <button class="panel-tab" [class.active]="aba() === 'meus'" (click)="aba.set('meus')">Meus perfis</button>
          <button class="panel-tab" [class.active]="aba() === 'pedidos'" (click)="aba.set('pedidos')">Minhas solicitações</button>
        </div>

        @if (aba() === 'pedidos') {
          @if (!minhasReiv().length && !meusInteresses().length) {
            <div class="empty-state"><i class="fas fa-inbox"></i><strong>Nenhuma solicitação.</strong><p>Suas solicitações aparecerão aqui.</p></div>
          } @else {
            <div class="panel-list">
              @for (x of minhasReiv(); track x.idDoc) {
                <div class="panel-item">
                  <div class="panel-item-title">Reivindicação • {{ x.nomeLocal || 'Perfil' }}</div>
                  <div class="panel-item-meta">Status: {{ x.status || 'pendente' }}</div>
                </div>
              }
              @for (x of meusInteresses(); track x.idDoc) {
                <div class="panel-item">
                  <div class="panel-item-title">Destaque • {{ x.nomeLocal || 'Perfil' }}</div>
                  <div class="panel-item-meta">Status: {{ x.status || 'pendente' }}</div>
                </div>
              }
            </div>
          }
        } @else {
          @if (!meusLocais().length) {
            <div class="empty-state">
              <i class="fas fa-store"></i>
              <strong>Você ainda não administra nenhum perfil.</strong>
              <p>Quando uma reivindicação for aprovada, o perfil aparecerá aqui.</p>
              <button class="btn-community primary" (click)="ui.abrir('escolhaAnuncio')">Adicionar um negócio</button>
            </div>
          } @else {
            <div class="panel-list">
              @for (l of meusLocais(); track l.idDoc) {
                <div class="panel-item">
                  <div class="panel-item-title">{{ l.nome || 'Perfil' }}</div>
                  <div class="panel-item-meta">{{ l.categoria || 'Serviço' }} • {{ l.bairro || 'Centro' }}, {{ l.cidade }}</div>
                  <div class="badges-container-inline">
                    @if (l.verificado) { <span class="verified-badge">✓ Verificado</span> }
                    @else { <span class="pending-badge">{{ l.status === 'pendente' ? 'Aguardando revisão' : 'Gestão pendente' }}</span> }
                    @if (destaque(l)) { <span class="featured-badge">★ Em destaque</span> }
                  </div>
                  <div class="panel-actions">
                    <button class="tiny-btn" (click)="editar(l)">Editar perfil</button>
                    <button class="tiny-btn" (click)="pedirDestaque(l)">Solicitar destaque</button>
                  </div>
                  <div class="profile-share">
                    <input class="form-control" readonly [value]="link(l)">
                    <button class="tiny-btn" (click)="copiar(l)">Copiar link</button>
                  </div>
                </div>
              }
            </div>
          }
        }
      }
    </app-modal>
  `,
})
export class ModalPainel implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly ui = inject(UiService);
  private readonly locais = inject(LocaisService);
  private readonly solicitacoes = inject(SolicitacoesService);

  protected readonly aba = signal<'meus' | 'pedidos'>('meus');
  protected readonly meusLocais = signal<Local[]>([]);
  protected readonly minhasReiv = signal<Reivindicacao[]>([]);
  protected readonly meusInteresses = signal<InteresseDestaque[]>([]);
  protected readonly pendentesReiv = signal<Reivindicacao[]>([]);
  protected readonly novosInteresses = signal<InteresseDestaque[]>([]);

  private unsubs: Unsubscribe[] = [];

  ngOnInit() {
    const uid = this.auth.user()?.uid;
    if (!uid) return;
    this.unsubs.push(
      this.locais.observarMeusLocais(uid, (l) => this.meusLocais.set(l)),
      this.solicitacoes.observarMinhasReivindicacoes(uid, (r) => this.minhasReiv.set(r)),
      this.solicitacoes.observarMeusInteresses(uid, (r) => this.meusInteresses.set(r)),
    );
    if (this.auth.isAdmin()) {
      this.unsubs.push(
        this.solicitacoes.observarReivindicacoesPendentes((r) => this.pendentesReiv.set(r)),
        this.solicitacoes.observarInteressesNovos((r) => this.novosInteresses.set(r)),
      );
    }
  }

  ngOnDestroy() {
    this.unsubs.forEach((fn) => { try { fn(); } catch { /* já encerrado */ } });
  }

  protected destaque = registroDestaque;
  protected link(l: Local) { return `${location.origin}/perfil/${l.idDoc}`; }

  protected async copiar(l: Local) {
    const url = this.link(l);
    try { await navigator.clipboard.writeText(url); alert('Link copiado.'); }
    catch { prompt('Copie o link:', url); }
  }

  protected editar(l: Local) {
    this.ui.localAtual.set(l);
    this.ui.abrir('editarPerfil');
  }

  protected pedirDestaque(l: Local) {
    this.ui.localAtual.set(l);
    this.ui.abrir('destaque');
  }

  protected async sair() {
    this.ui.fechar();
    try { await this.auth.sair(); }
    catch (e) { console.error('Erro ao sair:', e); alert('Erro ao sair da conta.'); }
  }

  // ---- Admin ----
  private async executar(confirmacao: string, acao: () => Promise<void>, sucesso?: string) {
    if (!this.auth.isAdmin() || !confirm(confirmacao)) return;
    try { await acao(); if (sucesso) alert(sucesso); }
    catch (e) { console.error(e); alert((e as Error).message); }
  }

  protected aprovarReiv(r: Reivindicacao) {
    return this.executar(`Aprovar gestão de ${r.nomeLocal}?`, () => this.solicitacoes.aprovarReivindicacao(r), 'Gestão aprovada.');
  }
  protected recusarReiv(r: Reivindicacao) {
    return this.executar('Recusar?', () => this.solicitacoes.recusarReivindicacao(r));
  }
  protected ativar(r: InteresseDestaque) {
    return this.executar(`Ativar destaque para ${r.nomeLocal}?`, () => this.solicitacoes.ativarDestaque(r), 'Destaque ativado.');
  }
  protected recusarDest(r: InteresseDestaque) {
    return this.executar('Recusar destaque?', () => this.solicitacoes.recusarDestaque(r));
  }
}
