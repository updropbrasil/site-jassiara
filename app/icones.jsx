'use client';
import { Palmtree, KeyRound, Building2, House, Store, Wrench, CarFront, Car, Sailboat, Rocket, Handshake, Instagram, ChevronRight, Sparkles, Plane, Briefcase, Camera, Heart, Star, Phone } from 'lucide-react';

// Ícones de linha dos botões da página inicial. O painel guarda o NOME (ex.: "palmeira") em presite_botoes.icone.
// Se o valor não for um nome conhecido (ex.: um emoji antigo), ele aparece como texto.
export const LISTA_ICONES = [
  ['palmeira', 'Palmeira', Palmtree],
  ['chave', 'Chave', KeyRound],
  ['predio', 'Prédio', Building2],
  ['casa', 'Casa', House],
  ['loja', 'Loja', Store],
  ['ferramenta', 'Ferramenta', Wrench],
  ['carro-executivo', 'Carro executivo', CarFront],
  ['carro', 'Carro', Car],
  ['barco', 'Barco', Sailboat],
  ['foguete', 'Foguete', Rocket],
  ['aperto-de-mao', 'Aperto de mão', Handshake],
  ['aviao', 'Avião', Plane],
  ['maleta', 'Maleta', Briefcase],
  ['camera', 'Câmera', Camera],
  ['coracao', 'Coração', Heart],
  ['estrela', 'Estrela', Star],
  ['telefone', 'Telefone', Phone],
  ['brilho', 'Brilho', Sparkles],
];

export const ICONES = { seta: ChevronRight, instagram: Instagram };
const MAPA = Object.fromEntries(LISTA_ICONES.map(([k, , C]) => [k, C]));

export function IconeServico({ nome, size = 20 }) {
  const C = MAPA[nome];
  if (C) return <C size={size} strokeWidth={1.7} />;
  if (nome) return <span style={{ fontSize: size, lineHeight: 1 }}>{nome}</span>;
  return <Sparkles size={size} strokeWidth={1.7} />;
}
