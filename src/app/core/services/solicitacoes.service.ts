import { Injectable } from '@angular/core';
import {
  Unsubscribe,
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { InteresseDestaque, Reivindicacao } from '../models/models';
import { limparWhatsApp } from '../utils/texto';

function mapear<T>(s: { docs: { id: string; data(): unknown }[] }): T[] {
  return s.docs.map((d) => ({ idDoc: d.id, ...(d.data() as object) }) as T);
}

@Injectable({ providedIn: 'root' })
export class SolicitacoesService {
  // ---------- Criação ----------
  async enviarInteresseDestaque(p: {
    localId: string;
    nomeLocal: string;
    email: string;
    whatsapp: string;
    userId: string;
  }): Promise<void> {
    await addDoc(collection(db, 'interessesDestaque'), {
      ...p,
      whatsapp: limparWhatsApp(p.whatsapp),
      status: 'novo',
      criadoEm: serverTimestamp(),
    });
  }

  async enviarIndicacao(p: {
    nome: string;
    servico: string;
    cidade: string;
    bairro: string;
    whatsapp: string;
    userId: string;
  }): Promise<void> {
    await addDoc(collection(db, 'indicacoes'), {
      ...p,
      whatsapp: limparWhatsApp(p.whatsapp),
      origem: 'busca-sem-resultado',
      status: 'pendente',
      criadoEm: serverTimestamp(),
    });
  }

  // ---------- Leitura em tempo real ----------
  observarMinhasReivindicacoes(uid: string, cb: (r: Reivindicacao[]) => void): Unsubscribe {
    const q = query(collection(db, 'reivindicacoes'), where('userId', '==', uid));
    return onSnapshot(q, (s) => cb(mapear<Reivindicacao>(s)), (e) => console.error(e));
  }

  observarMeusInteresses(uid: string, cb: (r: InteresseDestaque[]) => void): Unsubscribe {
    const q = query(collection(db, 'interessesDestaque'), where('userId', '==', uid));
    return onSnapshot(q, (s) => cb(mapear<InteresseDestaque>(s)), (e) => console.error(e));
  }

  observarReivindicacoesPendentes(cb: (r: Reivindicacao[]) => void): Unsubscribe {
    const q = query(collection(db, 'reivindicacoes'), where('status', '==', 'pendente'));
    return onSnapshot(q, (s) => cb(mapear<Reivindicacao>(s)), (e) => console.error(e));
  }

  observarInteressesNovos(cb: (r: InteresseDestaque[]) => void): Unsubscribe {
    const q = query(collection(db, 'interessesDestaque'), where('status', '==', 'novo'));
    return onSnapshot(q, (s) => cb(mapear<InteresseDestaque>(s)), (e) => console.error(e));
  }

  // ---------- Ações de admin ----------
  async aprovarReivindicacao(r: Reivindicacao): Promise<void> {
    const localRef = doc(db, 'locais', r.localId);
    const reqRef = doc(db, 'reivindicacoes', r.idDoc);
    await runTransaction(db, async (tx) => {
      const reqSnap = await tx.get(reqRef);
      if (!reqSnap.exists()) throw new Error('Solicitação não encontrada.');
      if (reqSnap.data()['status'] !== 'pendente') throw new Error('Já respondida.');
      const localSnap = await tx.get(localRef);
      if (!localSnap.exists()) throw new Error('Perfil não existe mais.');
      tx.update(localRef, {
        proprietarioUid: r.userId,
        proprietarioDeclarado: true,
        verificado: true,
        status: 'aprovado',
        atualizadoEm: serverTimestamp(),
      });
      tx.update(reqRef, { status: 'aprovado', aprovadoEm: serverTimestamp() });
    });
  }

  recusarReivindicacao(r: Reivindicacao): Promise<void> {
    return updateDoc(doc(db, 'reivindicacoes', r.idDoc), {
      status: 'recusado',
      respondidoEm: serverTimestamp(),
    });
  }

  async ativarDestaque(r: InteresseDestaque): Promise<void> {
    const localRef = doc(db, 'locais', r.localId);
    const pedidoRef = doc(db, 'interessesDestaque', r.idDoc);
    await runTransaction(db, async (tx) => {
      const pedidoSnap = await tx.get(pedidoRef);
      if (!pedidoSnap.exists()) throw new Error('Pedido não encontrado.');
      if (pedidoSnap.data()['status'] === 'aprovado') throw new Error('Já aprovado.');
      const localSnap = await tx.get(localRef);
      if (!localSnap.exists()) throw new Error('Perfil não existe mais.');
      tx.update(localRef, {
        destaque: true,
        plano: 'destaque',
        destaqueAtivadoEm: serverTimestamp(),
      });
      tx.update(pedidoRef, { status: 'aprovado', respondidoEm: serverTimestamp() });
    });
  }

  recusarDestaque(r: InteresseDestaque): Promise<void> {
    return updateDoc(doc(db, 'interessesDestaque', r.idDoc), {
      status: 'recusado',
      respondidoEm: serverTimestamp(),
    });
  }
}
