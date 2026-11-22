import { Local } from '../models/models';

const RELATED_TERMS: Record<string, string[]> = {
  eletricista: ['eletrica', 'instalacao eletrica', 'tomada', 'chuveiro', 'fiacao', 'energia'],
  eletrica: ['eletricista', 'instalacao eletrica', 'tomada', 'chuveiro'],
  costureira: ['costura', 'ajuste de roupa', 'barra', 'conserto de roupa', 'costureiro'],
  costura: ['costureira', 'costureiro', 'ajuste de roupa', 'barra'],
  faxina: ['diarista', 'limpeza', 'domestica', 'limpeza residencial'],
  diarista: ['faxina', 'limpeza', 'domestica', 'limpeza residencial'],
  pedreiro: ['obra', 'construcao', 'reforma', 'alvenaria'],
  pintor: ['pintura', 'pintura residencial', 'reforma'],
  jardineiro: ['jardinagem', 'jardim', 'poda', 'gramado'],
  mecanico: ['oficina', 'carro', 'automovel', 'manutencao'],
  celular: ['assistencia tecnica', 'telefone', 'smartphone', 'conserto'],
  computador: ['informatica', 'notebook', 'assistencia tecnica', 'pc'],
  cabeleireiro: ['salao', 'cabelo', 'cabeleireira', 'barbeiro'],
  barbeiro: ['barbearia', 'cabelo', 'corte masculino'],
  unha: ['manicure', 'pedicure', 'nail designer'],
  bolo: ['confeitaria', 'doces', 'bolos', 'salgados'],
  comida: ['alimentacao', 'restaurante', 'marmita', 'lanchonete'],
  pet: ['pet shop', 'veterinario', 'banho e tosa', 'animais'],
  veterinario: ['veterinario', 'pet', 'animais', 'clinica veterinaria'],
};

export function normalizarTexto(v: unknown): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function limparWhatsApp(v: unknown): string {
  return String(v ?? '').replace(/\D/g, '');
}

/** Abre o WhatsApp (wa.me). Devolve false se o número for inválido. */
export function abrirWhatsApp(numero: string | undefined, mensagem = ''): boolean {
  let n = limparWhatsApp(numero);
  if (!n) return false;
  if (n.startsWith('55') && (n.length === 12 || n.length === 13)) n = n.slice(2);
  if (n.length < 10 || n.length > 11) {
    alert('Este perfil ainda não tem um número de WhatsApp válido.');
    return false;
  }
  const url = `https://wa.me/55${n}${mensagem ? '?text=' + encodeURIComponent(mensagem) : ''}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

export function formatarNomeExibicao(texto: string): string {
  if (!texto) return 'Prestador local';
  const nomeLimpo = texto.replace(/^[\d.\-\s]+/, '').trim();
  if (!nomeLimpo) return 'Prestador local';
  const excecoes = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'na', 'no'];
  return nomeLimpo
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (excecoes.includes(p) && i !== 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

export function nomeExibicaoLocal(l: Local): string {
  const bruto = String(
    l.nomeFantasia || l.nome_fantasia || l.fantasia || l.nomeComercial || l.nome || 'Prestador local',
  ).trim();
  return formatarNomeExibicao(bruto);
}

export function descricaoCurtaLocal(l: Local): string {
  const texto = String(l.descricao || l.servicos || '').replace(/\s+/g, ' ').trim();
  return texto.length > 145 ? texto.slice(0, 142).trimEnd() + '…' : texto;
}

export function registroAprovado(x: { status?: string }): boolean {
  return x.status === 'aprovado' || x.status === 'ativo';
}

export function registroDestaque(x: Local): boolean {
  return x.destaque === true || x.plano === 'destaque' || x.plano === 'premium';
}

function textoLocal(l: Local): string {
  return normalizarTexto(
    [nomeExibicaoLocal(l), l.nome, l.categoria, l.subcategoria, l.descricao, l.servicos,
     l.keywords, l.palavrasChave, l.bairro, l.cidade, l.telefone].join(' '),
  );
}

function termosBusca(q: string): string[] {
  const partes = normalizarTexto(q).split(/\s+/).filter(Boolean);
  const extras: string[] = [];
  partes.forEach((p) => {
    const rel = RELATED_TERMS[p];
    if (rel) extras.push(...rel);
  });
  return [...new Set([...partes, ...extras])];
}

/** Mesma regra de busca do site atual: todas as palavras, ou algum termo relacionado. */
export function combinaBusca(l: Local, q: string): boolean {
  const base = normalizarTexto(q);
  if (!base) return true;
  const h = textoLocal(l);
  const partes = base.split(/\s+/).filter(Boolean);
  if (partes.every((x) => h.includes(x))) return true;
  return termosBusca(q).some((x) => x.length >= 3 && h.includes(normalizarTexto(x)));
}

export function mensagemWhatsApp(l: Local, cidadeFallback: string): string {
  const nome = nomeExibicaoLocal(l);
  const bairro = l.bairro || 'Centro';
  const cidade = l.cidade || cidadeFallback;
  return `Olá! Vi *${nome}* na Folha Amarela Digital (📍 ${bairro}, ${cidade}) e gostaria de mais informações.\n\nPerfil: ${location.origin}/perfil/${l.idDoc}`;
}

export function linkMapa(l: Local, cidadeFallback: string): string {
  const cidade = l.cidade || cidadeFallback;
  const q = l.endereco
    ? `${l.endereco}, ${cidade}`
    : `${nomeExibicaoLocal(l)}, ${l.bairro || 'Centro'}, ${cidade}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function mascaraCep(valor: string): string {
  const v = valor.replace(/\D/g, '').slice(0, 8);
  return v.length > 5 ? v.slice(0, 5) + '-' + v.slice(5) : v;
}

export function linkInstagram(handle: string): string {
  return `https://instagram.com/${handle.replace('@', '').trim()}`;
}
