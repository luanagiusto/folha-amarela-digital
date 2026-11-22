import { Injectable, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  /** true quando o token tem a Custom Claim `admin`. */
  readonly isAdmin = signal(false);

  constructor() {
    onAuthStateChanged(auth, async (u) => {
      this.user.set(u);
      this.isAdmin.set(false);
      if (u) {
        try {
          const token = await u.getIdTokenResult(true);
          this.isAdmin.set(token.claims['admin'] === true);
        } catch (e) {
          console.error('Não foi possível validar a Custom Claim admin:', e);
        }
      }
    });
  }

  entrar(email: string, senha: string) {
    return signInWithEmailAndPassword(auth, email, senha);
  }

  criarConta(email: string, senha: string) {
    return createUserWithEmailAndPassword(auth, email, senha);
  }

  sair() {
    return signOut(auth);
  }
}
