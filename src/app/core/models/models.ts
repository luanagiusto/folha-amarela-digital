import { Timestamp } from 'firebase/firestore';

export type StatusRegistro = 'pendente' | 'aprovado' | 'ativo' | 'recusado';

/** Documento da coleção `locais`. */
export interface Local {
  idDoc: string;
  nome: string;
  // Campos legados usados só para exibir o nome
  nomeFantasia?: string;
  nome_fantasia?: string;
  fantasia?: string;
  nomeComercial?: string;
  categoria?: string;
  subcategoria?: string;
  descricao?: string;
  servicos?: string;
  keywords?: string;
  palavrasChave?: string;
  cidade?: string;
  bairro?: string;
  cep?: string;
  endereco?: string;
  horario?: string;
  whatsapp?: string;
  telefone?: string;
  telefoneExtra?: string;
  instagram?: string;
  status?: StatusRegistro;
  destaque?: boolean;
  plano?: 'gratuito' | 'destaque' | 'premium';
  verificado?: boolean;
  proprietarioUid?: string;
  proprietarioDeclarado?: boolean;
  userId?: string;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
}

/** Dados que o formulário de cadastro/edição manipula. */
export interface LocalForm {
  nome: string;
  categoria: string;
  descricao: string;
  keywords: string;
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  horario: string;
  whatsapp: string;
  telefoneExtra: string;
  instagram: string;
}

/** Coleção `reivindicacoes`. */
export interface Reivindicacao {
  idDoc: string;
  localId: string;
  nomeLocal?: string;
  userId: string;
  email?: string;
  status: StatusRegistro;
}

/** Coleção `interessesDestaque`. */
export interface InteresseDestaque {
  idDoc: string;
  localId: string;
  nomeLocal?: string;
  email?: string;
  whatsapp?: string;
  userId?: string;
  status: 'novo' | 'aprovado' | 'recusado';
}

export const CATEGORIAS = ['Alimentação', 'Serviços', 'Pet Shop', 'Saúde'] as const;
export const CIDADE_PADRAO = 'Paraisópolis';
