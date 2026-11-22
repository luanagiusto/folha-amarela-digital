import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// A config web do Firebase é pública por desenho: quem protege os dados
// são as regras do Firestore/Storage (firestore.rules), não esta chave.
export const firebaseConfig = {
  apiKey: 'AIzaSyBxv7AWrRep8yRJyEK90nXgpEmO1zOfd8o',
  authDomain: 'folha-amarela-digital.firebaseapp.com',
  projectId: 'folha-amarela-digital',
  storageBucket: 'folha-amarela-digital.firebasestorage.app',
  messagingSenderId: '377984429498',
  appId: '1:377984429498:web:0ec71abadab20a93420183',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
