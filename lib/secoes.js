// Seções do site de imóveis da Jassiara (os botões da página inicial abrem /imoveis?f=<seção>).
// Locação por temporada, locação anual, na planta, pronto e comercial. "aluguel" e "venda" continuam valendo (links antigos).
export const COMERCIAIS = ['Ponto comercial', 'Sala comercial', 'Loja', 'Galpão', 'Comercial'];

export const SECOES = [
  { k: 'todos', label: 'Tudo' },
  { k: 'temporada', label: 'Temporada' },
  { k: 'anual', label: 'Locação anual' },
  { k: 'planta', label: 'Na planta' },
  { k: 'pronto', label: 'Prontos' },
  { k: 'comercial', label: 'Comercial' },
];
export const SECOES_VALIDAS = [...SECOES.map(s => s.k), 'aluguel', 'venda'];

export const ehComercial = (i) => COMERCIAIS.includes(i.categoria);

export function naSecao(i, k) {
  switch (k) {
    case 'todos': return true;
    case 'temporada': return i.finalidade === 'temporada';
    case 'anual': case 'aluguel': return i.finalidade === 'aluguel';
    case 'planta': return i.finalidade === 'venda' && i.estagio === 'planta';
    case 'pronto': return i.finalidade === 'venda' && i.estagio !== 'planta' && !ehComercial(i);
    case 'venda': return i.finalidade === 'venda';
    case 'comercial': return ehComercial(i);
    default: return true;
  }
}

// selo do card e sufixo do preço
export function seloImovel(i) {
  if (i.finalidade === 'temporada') return { texto: 'TEMPORADA', cor: 'var(--accent)' };
  if (i.finalidade === 'aluguel') return { texto: 'ALUGUEL', cor: 'var(--accent)' };
  if (i.estagio === 'planta') return { texto: 'NA PLANTA', cor: 'var(--green)' };
  return { texto: 'VENDA', cor: 'var(--green)' };
}
export const sufixoPreco = (i) => (i.finalidade === 'temporada' ? '/diária' : i.finalidade === 'aluguel' ? '/mês' : '');
export const ehLocacao = (i) => i.finalidade === 'aluguel' || i.finalidade === 'temporada';
