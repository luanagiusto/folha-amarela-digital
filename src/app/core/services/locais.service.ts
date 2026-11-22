import { Injectable, signal } from '@angular/core';
import {
  Unsubscribe,
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Local, LocalForm } from '../models/models';
import { limparWhatsApp } from '../utils/texto';

@Injectable({ providedIn: 'root' })
export class LocaisService {
  /** Locais aprovados/ativos, atualizados em tempo real. */
  readonly locais = signal<Local[]>([]);
  readonly carregando = signal(true);

  constructor() {
    const q = query(collection(db, 'locais'), where('status', 'in', ['aprovado', 'ativo']));
    onSnapshot(
      q,
      (snap) => {
        this.locais.set(snap.docs.map((d) => ({ idDoc: d.id, ...d.data() }) as Local));
        this.carregando.set(false);
      },
      (e) => {
        console.error(e);
        this.carregando.set(false);
      },
    );
  }

  async obterPorId(id: string): Promise<Local | null> {
    const snap = await getDoc(doc(db, 'locais', id));
    return snap.exists() ? ({ idDoc: snap.id, ...snap.data() } as Local) : null;
  }

  /** Perfis que o usuário administra (proprietarioUid == uid). */
  observarMeusLocais(uid: string, cb: (l: Local[]) => void): Unsubscribe {
    const q = query(collection(db, 'locais'), where('proprietarioUid', '==', uid));
    return onSnapshot(
      q,
      (s) => cb(s.docs.map((d) => ({ idDoc: d.id, ...d.data() }) as Local)),
      (e) => console.error(e),
    );
  }

  /** Novo cadastro: entra como `pendente` e passa por revisão. */
  async criar(f: LocalForm, uid: string | null): Promise<void> {
    await addDoc(collection(db, 'locais'), {
      nome: f.nome.trim(),
      categoria: f.categoria,
      descricao: f.descricao.trim(),
      keywords: f.keywords.trim(),
      cidade: f.cidade.trim(),
      bairro: f.bairro.trim() || 'Centro',
      whatsapp: limparWhatsApp(f.whatsapp),
      cep: f.cep.replace(/\D/g, ''),
      endereco: f.endereco.trim(),
      horario: f.horario.trim(),
      telefoneExtra: limparWhatsApp(f.telefoneExtra),
      instagram: f.instagram.trim(),
      userId: uid ?? '',
      status: 'pendente',
      destaque: false,
      plano: 'gratuito',
      criadoEm: serverTimestamp(),
    });
  }

  async atualizar(id: string, f: LocalForm): Promise<void> {
    await updateDoc(doc(db, 'locais', id), {
      nome: f.nome.trim(),
      categoria: f.categoria,
      descricao: f.descricao.trim(),
      keywords: f.keywords.trim(),
      cidade: f.cidade.trim(),
      bairro: f.bairro.trim() || 'Centro',
      whatsapp: limparWhatsApp(f.whatsapp),
      cep: f.cep.replace(/\D/g, ''),
      endereco: f.endereco.trim(),
      horario: f.horario.trim(),
      telefoneExtra: limparWhatsApp(f.telefoneExtra),
      instagram: f.instagram.trim(),
      atualizadoEm: serverTimestamp(),
    });
  }
}
