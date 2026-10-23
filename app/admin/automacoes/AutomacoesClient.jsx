'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';
import TourGuiado, { useTourPrimeiraVez } from '../TourGuiado';
import {
  Instagram, MessageCircle, Send, Bot, Zap, Plus, Copy, Trash2, Pencil, ShieldCheck, Clock, Link2, House, X,
  ChevronLeft, Sparkles, MessagesSquare, Check, Activity, Power, CircleHelp, Lock
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Painel de automações por GATILHO (Instagram comentário / Instagram direct / WhatsApp).
// Regra de ouro: só responde quem acionar um gatilho. Quem chamar a Jassiara normalmente
// nunca recebe resposta automática — a conversa é dela.
// ─────────────────────────────────────────────────────────────────────────────

const CANAIS = {
  ig_comentario: { rotulo: 'Comentário no Instagram', curto: 'Comentário', ajuda: 'A pessoa comenta uma palavra num post ou reels.', Icone: MessagesSquare, cor: '#E8789A' },
  ig_dm: { rotulo: 'Direct do Instagram', curto: 'Direct', ajuda: 'A pessoa manda a palavra no seu direct.', Icone: Send, cor: '#C98BD9' },
  whatsapp: { rotulo: 'Mensagem no WhatsApp', curto: 'WhatsApp', ajuda: 'A pessoa manda a palavra no seu WhatsApp.', Icone: MessageCircle, cor: '#5FD38D' },
};
const BOTOES = [
  { v: 'nenhum', l: 'Sem botão' },
  { v: 'whatsapp', l: 'Meu WhatsApp' },
  { v: 'imovel', l: 'Um imóvel do site' },
  { v: 'link', l: 'Outro link' },
];
const HORAS = [2, 6, 12, 24, 48];
const NOVA = {
  nome: '', canal: 'ig_comentario', palavras: [], modo: 'contem', post_url: '', resp_publicas: [''], msg_texto: '',
  botao_tipo: 'nenhum', botao_texto: '', botao_url: '', botao_whats_msg: 'Oi, Jassiara! Vim pelo Instagram e quero saber mais.', imovel_codigo: '',
  ia_assume: false, ia_horas: 24, uma_vez: true, atraso: true, ativo: true,
};

// ── Tours guiados ("Como funciona") ──
const TOUR_LISTA = [
  { titulo: 'Bem-vinda às Automações 👋', texto: 'Aqui você cria respostas automáticas no Instagram e no WhatsApp.\n\nMas só para quem usar uma PALAVRA que você escolher, como “QUERO” ou “PREÇO”. O resto do seu atendimento continua sendo seu.' },
  { alvo: '[data-tour="geral"]', titulo: 'Chave geral', texto: 'Liga ou pausa todas as automações de uma vez. Pausado, nada dispara — nem os gatilhos ligados.' },
  { alvo: '[data-tour="regra"]', titulo: 'Como cada canal funciona', texto: 'WhatsApp: a secretária IA atende, tira dúvidas, manda os imóveis e te chama quando o cliente quer visitar ou fechar.\n\nInstagram: só responde quem usar a palavra de um gatilho (ou a secretária, se você ligar).\n\nE a regra de ouro: se você mandar qualquer mensagem numa conversa, o robô PARA na hora naquela conversa. Você entrou, a conversa é sua.' },
  { alvo: '[data-tour="secretaria"]', titulo: 'Secretária IA', texto: 'Liga ou desliga a secretária em cada canal. Ela já conhece seus serviços e os imóveis do site. Quem ajusta o que ela sabe é o suporte.' },
  { alvo: '[data-tour="canais"]', titulo: 'Seus canais', texto: 'Mostra se o Instagram e o WhatsApp estão conectados. Só funciona o que estiver conectado.\n\nPara ligar o Instagram, toque em “Conectar Instagram”, entre com a sua conta e autorize. Pronto.' },
  { alvo: '[data-tour="criar"]', titulo: 'Criar um gatilho', texto: 'Um gatilho é: QUANDO a pessoa fizer isso → ACONTECE aquilo.\n\nExemplo: quando comentar “QUERO” num post → responde o comentário e manda o link no direct.' },
  { alvo: '[data-tour="cartao"]', titulo: 'Cada gatilho é um cartão', texto: 'Em cima: onde funciona e a frase “Quando…”. No meio: o que ele faz. A chavinha liga e desliga só este gatilho. Embaixo: quantas vezes já disparou, editar, duplicar e excluir.' },
  { alvo: '[data-tour="aba-atividade"]', titulo: 'Atividade', texto: 'Tudo o que aconteceu: quem foi, o que escreveu e o que recebeu.\n\nQuando a secretária pedir você numa conversa, aparece aqui. E o botão “Assumir conversa” tira o robô daquela conversa.' },
  { titulo: 'Pronto! Um exemplo para começar', texto: 'Poste um imóvel com a frase “Comenta QUERO que te mando o vídeo”.\n\nLigue o gatilho “Comentou QUERO”. Quem comentar recebe a resposta no comentário e o link no direct. Quem clicar e te chamar no WhatsApp é atendido pela secretária, que te chama na hora certa.\n\nEste guia fica sempre no botão “Como funciona”.' },
];
const TOUR_EDITOR = [
  { titulo: 'Montando um gatilho', texto: 'São 5 passos. À direita (no celular, em cima) aparece a prévia: exatamente o que o cliente vai ver.' },
  { alvo: '[data-tour="p1"]', titulo: '1. Onde', texto: 'Comentário no Instagram, direct do Instagram ou mensagem no WhatsApp.' },
  { alvo: '[data-tour="p2"]', titulo: '2. A palavra', texto: 'Digite e toque em Adicionar. Pode ter mais de uma (QUERO, EU QUERO). Maiúscula e acento não importam.\n\n“Contém” dispara em “quero ver”; “é só a palavra” dispara só em “quero”.' },
  { alvo: '[data-tour="p3"]', titulo: '3. O que acontece', texto: 'Resposta pública no comentário (escreva até 3 versões: o sistema sorteia, fica natural), a mensagem no direct/WhatsApp e, se quiser, um botão: seu WhatsApp, um imóvel do site ou um link.' },
  { alvo: '[data-tour="p4"]', titulo: '4. Depois disso', texto: 'Escolha se a secretária IA continua a conversa no Instagram (e por quanto tempo). Se você mandar qualquer mensagem, ela para na hora.\n\n“Uma vez por pessoa” evita mandar de novo para quem já recebeu.' },
  { alvo: '[data-tour="previa"]', titulo: 'Prévia', texto: 'Confira aqui antes de salvar. Depois é só tocar em “Salvar gatilho” e deixar a chavinha ligada.' },
];

const caixa = { width: '100%', boxSizing: 'border-box', background: '#1F2218', border: '1px solid rgba(240,232,221,.15)', borderRadius: 10, padding: '12px 13px', color: 'var(--cream)', fontSize: 15, fontFamily: 'inherit' };
const cartao = { background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 16, padding: 16 };
const rotulo = { fontSize: 13, fontWeight: 700, color: 'var(--cream-2)' };
const ajudaSt = { fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.45 };

function fmtQuando(d) {
  if (!d) return '';
  const t = new Date(d); const s = (Date.now() - t.getTime()) / 1000;
  if (s < 60) return 'agora'; if (s < 3600) return `há ${Math.floor(s / 60)} min`; if (s < 86400) return `há ${Math.floor(s / 3600)} h`;
  return t.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
const listaPalavras = (p) => (p || []).map(x => `“${x}”`).join(' ou ');
function resumoQuando(r) {
  const pal = listaPalavras(r.palavras) || '(sem palavra)';
  const modo = r.modo === 'exata' ? 'exatamente' : '';
  if (r.canal === 'ig_comentario') return `Quando comentar ${modo} ${pal} ${r.post_url ? 'naquele post' : 'em qualquer post'}`.replace(/\s+/g, ' ');
  if (r.canal === 'ig_dm') return `Quando mandar ${modo} ${pal} no direct`.replace(/\s+/g, ' ');
  return `Quando mandar ${modo} ${pal} no WhatsApp`.replace(/\s+/g, ' ');
}
function acoesDe(r) {
  const a = [];
  if (r.canal === 'ig_comentario' && (r.resp_publicas || []).some(x => x?.trim())) a.push('Responde o comentário');
  if ((r.msg_texto || '').trim()) a.push(r.canal === 'whatsapp' ? 'Responde no WhatsApp' : 'Manda no direct');
  if (r.botao_tipo && r.botao_tipo !== 'nenhum') a.push(r.botao_tipo === 'whatsapp' ? 'Botão do WhatsApp' : r.botao_tipo === 'imovel' ? `Imóvel ${r.imovel_codigo || ''}`.trim() : 'Botão com link');
  if (r.ia_assume) a.push(`Secretária IA por ${r.ia_horas}h`);
  return a;
}

function Chave({ ligado, onClick, rotuloAria }) {
  return (
    <button type="button" onClick={onClick} aria-label={rotuloAria} aria-pressed={ligado}
      style={{ flex: '0 0 auto', width: 50, height: 30, borderRadius: 999, border: 0, padding: 3, cursor: 'pointer', background: ligado ? 'var(--green)' : 'rgba(240,232,221,.18)', transition: 'background .2s' }}>
      <span style={{ display: 'block', width: 24, height: 24, borderRadius: 999, background: ligado ? '#1d2016' : '#BDB49F', transform: ligado ? 'translateX(20px)' : 'none', transition: 'transform .2s' }} />
    </button>
  );
}

function Linha({ titulo, ajuda, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
      <div style={{ minWidth: 0 }}><div style={rotulo}>{titulo}</div>{ajuda && <div style={ajudaSt}>{ajuda}</div>}</div>
      {children}
    </div>
  );
}

function Passo({ n, titulo, children }) {
  return (
    <section data-tour={'p' + n} style={{ ...cartao, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 999, background: 'rgba(201,162,126,.16)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{n}</span>
        <strong style={{ fontSize: 15.5, color: 'var(--cream-2)' }}>{titulo}</strong>
      </div>
      {children}
    </section>
  );
}

// Prévia de como o cliente vê (celular)
function Previa({ r, linkBotao }) {
  const C = CANAIS[r.canal];
  const pal = (r.palavras || [])[0] || 'QUERO';
  const publica = (r.resp_publicas || []).find(x => x?.trim());
  const bolha = (lado, txt, extra) => (
    <div style={{ alignSelf: lado === 'eu' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: lado === 'eu' ? (r.canal === 'whatsapp' ? '#1F4D36' : '#3A2F4A') : '#2A2D22', color: '#F3EDE3', padding: '9px 12px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
      {txt}{extra}
    </div>
  );
  return (
    <div style={{ ...cartao, background: '#15170F', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        <C.Icone size={14} color={C.cor} /> Como o cliente vê
      </div>
      {r.canal === 'ig_comentario' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
          <div><strong>cliente</strong> <span style={{ color: '#D8CFC0' }}>{pal.toLowerCase()}</span></div>
          {publica && <div style={{ paddingLeft: 18, borderLeft: '2px solid rgba(240,232,221,.15)' }}><strong>você</strong> <span style={{ color: '#D8CFC0' }}>{publica}</span></div>}
        </div>
      ) : bolha('cliente', pal)}
      {(r.msg_texto || '').trim() && (
        <>
          {r.canal === 'ig_comentario' && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>No direct da pessoa:</div>}
          {bolha('eu', r.msg_texto.trim(), r.botao_tipo !== 'nenhum' && (r.botao_texto || '').trim() ? (
            <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,.1)', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
              {r.botao_texto.trim()}{linkBotao ? '' : ' (falta o link)'}
            </div>
          ) : null)}
        </>
      )}
      {r.ia_assume && <div style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6 }}><Bot size={14} /> Se a pessoa responder, a secretária continua por até {r.ia_horas}h.</div>}
      {!r.ia_assume && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Se a pessoa responder, quem continua é você.</div>}
    </div>
  );
}

export default function AutomacoesClient({ regrasIniciais, eventosIniciais, cfgInicial, imoveis }) {
  const supabase = createClient();
  const [regras, setRegras] = useState(regrasIniciais);
  const [eventos, setEventos] = useState(eventosIniciais);
  const [cfg, setCfg] = useState(cfgInicial);
  const [aba, setAba] = useState('gatilhos');
  const [ed, setEd] = useState(null); // regra em edição
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmaExcluir, setConfirmaExcluir] = useState(null);
  const [novaPalavra, setNovaPalavra] = useState('');
  const [tourLista, setTourLista, fecharTourLista] = useTourPrimeiraVez('tour_automacoes_v1');
  const [tourEd, setTourEd, fecharTourEd] = useTourPrimeiraVez('tour_automacoes_editor_v1');
  const secWa = (cfg.secretaria_whatsapp || 'sim') === 'sim';
  const igApp = String(cfg.instagram_app_id || '').trim();
  // volta do login do Instagram (n8n redireciona para cá com ?instagram=conectado|cancelado)
  useEffect(() => {
    try {
      const v = new URLSearchParams(window.location.search).get('instagram');
      if (v === 'conectado') { setMsg('Instagram conectado ✓'); setCfg(c => ({ ...c, auto_instagram_status: 'conectado' })); }
      else if (v === 'cancelado') setMsg('A conexão com o Instagram foi cancelada.');
      if (v) window.history.replaceState(null, '', window.location.pathname);
    } catch (e) {}
  }, []);
  function conectarInstagram() {
    if (!igApp) return;
    const u = new URL('https://www.instagram.com/oauth/authorize');
    u.searchParams.set('enable_fb_login', '0');
    u.searchParams.set('force_authentication', '1');
    u.searchParams.set('client_id', igApp);
    u.searchParams.set('redirect_uri', 'https://n8n.updropbrasil.com.br/webhook/instagram-oauth');
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('scope', 'instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments');
    u.searchParams.set('state', 'jassiara-' + Date.now().toString(36));
    window.location.href = u.toString();
  }
  const secIg = cfg.secretaria_instagram === 'sim';

  const ligadas = cfg.auto_ligadas === 'sim';
  const whats = String(cfg.site_whatsapp || cfg.presite_whatsapp || '').replace(/\D/g, '');
  const aviso = (t) => { setMsg(t); setTimeout(() => setMsg(m => (m === t ? '' : m)), 3500); };

  function linkDoBotao(r) {
    if (r.botao_tipo === 'whatsapp') return whats ? `https://wa.me/${whats}?text=${encodeURIComponent(r.botao_whats_msg || '')}` : '';
    if (r.botao_tipo === 'imovel') { const i = imoveis.find(x => x.codigo === r.imovel_codigo); return i ? `https://jassiara.com.br/imovel/${i.slug}` : ''; }
    if (r.botao_tipo === 'link') return /^https?:\/\//.test(r.botao_url || '') ? r.botao_url : '';
    return '';
  }

  async function gravarCfg(pares) {
    const linhas = Object.entries(pares).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('site_config').upsert(linhas);
    if (error) { aviso('Não salvou: ' + error.message); return false; }
    setCfg(c => ({ ...c, ...pares })); return true;
  }

  async function alternarGeral() {
    if (await gravarCfg({ auto_ligadas: ligadas ? 'nao' : 'sim' })) aviso(ligadas ? 'Automações pausadas.' : 'Automações ligadas.');
  }

  async function alternarRegra(r) {
    const { error } = await supabase.from('automacoes').update({ ativo: !r.ativo }).eq('id', r.id);
    if (error) { aviso('Não salvou: ' + error.message); return; }
    setRegras(rs => rs.map(x => (x.id === r.id ? { ...x, ativo: !r.ativo } : x)));
  }

  function abrir(r) {
    setNovaPalavra('');
    setEd(r ? { ...NOVA, ...r, resp_publicas: [...(r.resp_publicas || [])], palavras: [...(r.palavras || [])] } : { ...NOVA, palavras: [], resp_publicas: [''] });
  }
  const set = (p) => setEd(e => ({ ...e, ...p }));

  function addPalavra(txt) {
    const novas = String(txt || '').split(/[,\n]/).map(x => x.trim().toUpperCase()).filter(Boolean);
    if (!novas.length) return;
    setEd(e => ({ ...e, palavras: [...new Set([...(e.palavras || []), ...novas])] }));
    setNovaPalavra('');
  }

  async function salvar() {
    const r = { ...ed };
    if (novaPalavra.trim()) r.palavras = [...new Set([...(r.palavras || []), ...novaPalavra.split(',').map(x => x.trim().toUpperCase()).filter(Boolean)])];
    const publicas = (r.resp_publicas || []).map(x => (x || '').trim()).filter(Boolean);
    if (!r.palavras.length) return aviso('Coloque pelo menos uma palavra que dispara o gatilho.');
    if (r.canal === 'ig_comentario' && !publicas.length && !(r.msg_texto || '').trim()) return aviso('Escolha o que acontece: responder o comentário e/ou mandar no direct.');
    if (r.canal !== 'ig_comentario' && !(r.msg_texto || '').trim()) return aviso('Escreva a mensagem que a pessoa vai receber.');
    if (r.botao_tipo !== 'nenhum' && !(r.botao_texto || '').trim()) return aviso('Escreva o texto do botão.');
    if (r.botao_tipo !== 'nenhum' && !linkDoBotao(r)) return aviso(r.botao_tipo === 'whatsapp' ? 'Cadastre seu WhatsApp na Página inicial.' : r.botao_tipo === 'imovel' ? 'Escolha o imóvel.' : 'O link precisa começar com https://');
    const linha = {
      nome: (r.nome || '').trim() || `${CANAIS[r.canal].curto}: ${r.palavras[0]}`,
      canal: r.canal, palavras: r.palavras, modo: r.modo,
      post_url: r.canal === 'ig_comentario' ? ((r.post_url || '').trim() || null) : null,
      resp_publicas: r.canal === 'ig_comentario' ? publicas : [],
      msg_texto: (r.msg_texto || '').trim() || null,
      botao_tipo: r.botao_tipo, botao_texto: r.botao_tipo === 'nenhum' ? null : r.botao_texto.trim(),
      botao_url: r.botao_tipo === 'nenhum' ? null : linkDoBotao(r),
      botao_whats_msg: r.botao_tipo === 'whatsapp' ? (r.botao_whats_msg || '').trim() : null,
      imovel_codigo: r.botao_tipo === 'imovel' ? r.imovel_codigo : null,
      ia_assume: !!r.ia_assume, ia_horas: Number(r.ia_horas) || 24, uma_vez: !!r.uma_vez, atraso: !!r.atraso, ativo: !!r.ativo,
    };
    setSalvando(true);
    const q = r.id ? supabase.from('automacoes').update(linha).eq('id', r.id).select('*').single()
      : supabase.from('automacoes').insert({ ...linha, ordem: regras.length + 1 }).select('*').single();
    const { data, error } = await q;
    setSalvando(false);
    if (error) return aviso('Não salvou: ' + error.message);
    setRegras(rs => (r.id ? rs.map(x => (x.id === r.id ? data : x)) : [...rs, data]));
    setEd(null); aviso('Gatilho salvo ✓');
  }

  async function duplicar(r) {
    const { id, created_at, updated_at, disparos, ultimo_disparo, ...resto } = r;
    const { data, error } = await supabase.from('automacoes').insert({ ...resto, nome: r.nome + ' (cópia)', ativo: false, ordem: regras.length + 1 }).select('*').single();
    if (error) return aviso('Não duplicou: ' + error.message);
    setRegras(rs => [...rs, data]); aviso('Duplicado (desligado). Ajuste e ligue.');
  }

  async function excluir(r) {
    if (confirmaExcluir !== r.id) { setConfirmaExcluir(r.id); setTimeout(() => setConfirmaExcluir(c => (c === r.id ? null : c)), 3500); return; }
    const { error } = await supabase.from('automacoes').delete().eq('id', r.id);
    if (error) return aviso('Não excluiu: ' + error.message);
    setRegras(rs => rs.filter(x => x.id !== r.id)); setConfirmaExcluir(null);
  }

  // tira o robô daquela conversa (mesma coisa que ela responder): 12 h sem secretária/gatilho para esse contato
  async function desligarIA(ev) {
    const agora = new Date().toISOString();
    const ate = new Date(Date.now() + 12 * 3600e3).toISOString();
    const { error } = await supabase.from('automacao_eventos').update({ ia_ate: agora }).eq('id', ev.id);
    if (error) return aviso('Não salvou: ' + error.message);
    if (ev.contato_id) await supabase.from('conversas').update({ assumida_ate: ate }).eq('canal', ev.canal === 'whatsapp' ? 'whatsapp' : 'instagram').eq('contato_id', ev.contato_id);
    setEventos(es => es.map(x => (x.id === ev.id ? { ...x, ia_ate: agora } : x))); aviso('Pronto, a conversa agora é sua.');
  }

  async function alternarSecretaria(chave, atual) {
    if (await gravarCfg({ [chave]: atual ? 'nao' : 'sim' })) aviso(atual ? 'Secretária desligada nesse canal.' : 'Secretária ligada nesse canal.');
  }

  const statusCanal = (v) => (v === 'conectado' ? { t: 'Conectado', c: 'var(--green)' } : v === 'aguardando' ? { t: 'Aguardando liberação', c: '#E2B86B' } : { t: 'Ainda não conectado', c: 'var(--muted)' });
  const sIg = statusCanal(cfg.auto_instagram_status), sWa = statusCanal(cfg.auto_whatsapp_status);
  const iaAtiva = eventos.filter(e => e.ia_ate && new Date(e.ia_ate) > new Date());

  // ─────────── EDITOR ───────────
  if (ed) {
    const C = CANAIS[ed.canal];
    const linkB = linkDoBotao(ed);
    return (
      <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)', paddingBottom: 110 }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setEd(null)} aria-label="Voltar" style={{ width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(240,232,221,.15)', background: 'transparent', color: 'var(--sand)', display: 'grid', placeItems: 'center' }}><ChevronLeft size={20} /></button>
          <strong style={{ fontSize: 17, flex: 1 }}>{ed.id ? 'Editar gatilho' : 'Novo gatilho'}</strong>
          <button onClick={() => setTourEd(true)} style={btnAjuda}><CircleHelp size={16} /> <span className="so-pc">Como funciona</span></button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>Ligado</span>
          <Chave ligado={ed.ativo} onClick={() => set({ ativo: !ed.ativo })} rotuloAria="Gatilho ligado" />
        </header>

        <div className="auto-grade" style={{ maxWidth: 1080, margin: '0 auto', padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Passo n="1" titulo="Onde a pessoa interage?">
              <div style={{ display: 'grid', gap: 8 }}>
                {Object.entries(CANAIS).map(([k, c]) => (
                  <button key={k} onClick={() => set({ canal: k })} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: 13, borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${ed.canal === k ? 'var(--accent)' : 'var(--line)'}`, background: ed.canal === k ? 'rgba(201,162,126,.08)' : 'transparent', color: 'var(--cream)' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, background: c.cor + '22', color: c.cor, display: 'grid', placeItems: 'center', flex: 'none' }}><c.Icone size={19} /></span>
                    <span style={{ flex: 1 }}><strong style={{ display: 'block', fontSize: 14.5 }}>{c.rotulo}</strong><span style={ajudaSt}>{c.ajuda}</span></span>
                    {ed.canal === k && <Check size={18} color="var(--accent)" />}
                  </button>
                ))}
              </div>
            </Passo>

            <Passo n="2" titulo="Qual palavra dispara?">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(ed.palavras || []).map(p => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 8px 7px 12px', borderRadius: 999, background: 'rgba(201,162,126,.14)', border: '1px solid rgba(201,162,126,.4)', color: 'var(--accent)', fontWeight: 700, fontSize: 13.5 }}>
                    {p}<button onClick={() => set({ palavras: ed.palavras.filter(x => x !== p) })} aria-label={`Tirar ${p}`} style={{ background: 'none', border: 0, color: 'var(--accent)', padding: 0, display: 'grid', placeItems: 'center' }}><X size={15} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={novaPalavra} onChange={e => setNovaPalavra(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addPalavra(novaPalavra); } }}
                  placeholder="Ex.: QUERO" style={{ ...caixa, flex: 1 }} enterKeyHint="done" />
                <button onClick={() => addPalavra(novaPalavra)} style={{ padding: '0 16px', borderRadius: 10, border: 0, background: 'var(--accent)', color: '#22251A', fontWeight: 700 }}>Adicionar</button>
              </div>
              <div style={{ display: 'flex', background: '#1F2218', borderRadius: 10, padding: 3, border: '1px solid var(--line)' }}>
                {[['contem', 'A mensagem contém a palavra'], ['exata', 'A mensagem é só a palavra']].map(([v, l]) => (
                  <button key={v} onClick={() => set({ modo: v })} style={{ flex: 1, padding: '10px 6px', borderRadius: 8, border: 0, fontSize: 12.5, fontWeight: ed.modo === v ? 700 : 500, background: ed.modo === v ? 'var(--accent)' : 'transparent', color: ed.modo === v ? '#22251A' : 'var(--sand)' }}>{l}</button>
                ))}
              </div>
              <div style={ajudaSt}>Maiúscula, minúscula e acento não importam: “quero”, “Quero” e “QUERO” disparam igual.</div>
              {ed.canal === 'ig_comentario' && (
                <>
                  <div style={rotulo}>Em qual post?</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['', 'Qualquer post ou reels'], ['um', 'Só em um post']].map(([v, l]) => {
                      const sel = v ? ed.post_url !== '' && ed.post_url != null : !ed.post_url;
                      return <button key={l} onClick={() => set({ post_url: v ? (ed.post_url || 'https://www.instagram.com/p/') : '' })} style={{ flex: 1, padding: '11px 8px', borderRadius: 10, fontSize: 13, fontWeight: sel ? 700 : 500, border: `1px solid ${sel ? 'var(--accent)' : 'var(--line)'}`, background: sel ? 'rgba(201,162,126,.1)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--sand)' }}>{l}</button>;
                    })}
                  </div>
                  {!!ed.post_url && <input value={ed.post_url} onChange={e => set({ post_url: e.target.value })} placeholder="Cole o link do post (Instagram → ··· → Copiar link)" style={caixa} />}
                </>
              )}
              <div style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 12, background: 'rgba(168,192,143,.08)', border: '1px solid rgba(168,192,143,.25)' }}>
                <ShieldCheck size={18} color="var(--green)" style={{ flex: 'none', marginTop: 1 }} />
                <span style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--sand)' }}>Só dispara para quem usar a palavra. {ed.canal === 'ig_comentario' ? 'Os outros comentários ficam do jeito que estão.' : 'Quem te chamar com outra mensagem não recebe nada automático: a conversa é sua.'}</span>
              </div>
            </Passo>

            <Passo n="3" titulo="O que acontece?">
              {ed.canal === 'ig_comentario' && (
                <>
                  <Linha titulo="Responder o comentário (público)" ajuda="Sorteia uma das respostas para não parecer robô.">
                    <Chave ligado={(ed.resp_publicas || []).length > 0} onClick={() => set({ resp_publicas: (ed.resp_publicas || []).length > 0 ? [] : [''] })} rotuloAria="Responder comentário" />
                  </Linha>
                  {(ed.resp_publicas || []).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {ed.resp_publicas.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6 }}>
                          <input value={t || ''} onChange={e => set({ resp_publicas: ed.resp_publicas.map((x, j) => (j === i ? e.target.value : x)) })} placeholder={['Te mandei no direct! 💛', 'Olha seu direct 😉', 'Acabei de te chamar no direct!'][i] || 'Outra resposta'} style={{ ...caixa, flex: 1 }} />
                          {ed.resp_publicas.length > 1 && <button onClick={() => set({ resp_publicas: ed.resp_publicas.filter((_, j) => j !== i) })} aria-label="Tirar resposta" style={{ width: 42, borderRadius: 10, border: '1px solid var(--line)', background: 'transparent', color: 'var(--muted)', display: 'grid', placeItems: 'center' }}><X size={16} /></button>}
                        </div>
                      ))}
                      {ed.resp_publicas.length < 3 && <button onClick={() => set({ resp_publicas: [...ed.resp_publicas, ''] })} style={{ alignSelf: 'flex-start', background: 'none', border: 0, color: 'var(--accent)', fontWeight: 700, fontSize: 13, padding: 0 }}>+ outra variação</button>}
                    </div>
                  )}
                </>
              )}
              <div style={rotulo}>{ed.canal === 'ig_comentario' ? 'Mensagem no direct da pessoa' : ed.canal === 'ig_dm' ? 'Resposta no direct' : 'Resposta no WhatsApp'}</div>
              <textarea value={ed.msg_texto || ''} onChange={e => set({ msg_texto: e.target.value })} rows={4} placeholder="Oi! Que bom que você gostou 😊 Separei as informações pra você…" style={{ ...caixa, resize: 'vertical' }} />
              {ed.canal === 'ig_comentario' && <div style={ajudaSt}>Deixe em branco se quiser só responder o comentário.</div>}

              <div style={rotulo}>Botão na mensagem</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {BOTOES.map(b => (
                  <button key={b.v} onClick={() => set({ botao_tipo: b.v, botao_texto: ed.botao_texto || (b.v === 'whatsapp' ? 'Falar comigo no WhatsApp' : b.v === 'imovel' ? 'Ver o imóvel com vídeo' : b.v === 'link' ? 'Ver mais' : '') })}
                    style={{ padding: '9px 13px', borderRadius: 999, fontSize: 13, fontWeight: ed.botao_tipo === b.v ? 700 : 500, border: `1px solid ${ed.botao_tipo === b.v ? 'var(--accent)' : 'var(--line)'}`, background: ed.botao_tipo === b.v ? 'rgba(201,162,126,.12)' : 'transparent', color: ed.botao_tipo === b.v ? 'var(--accent)' : 'var(--sand)' }}>{b.l}</button>
                ))}
              </div>
              {ed.botao_tipo !== 'nenhum' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input value={ed.botao_texto || ''} onChange={e => set({ botao_texto: e.target.value })} placeholder="Texto do botão" style={caixa} />
                  {ed.botao_tipo === 'whatsapp' && (
                    <>
                      <textarea value={ed.botao_whats_msg || ''} onChange={e => set({ botao_whats_msg: e.target.value })} rows={2} placeholder="Mensagem que já vem escrita no WhatsApp" style={{ ...caixa, resize: 'vertical' }} />
                      <div style={ajudaSt}>{whats ? <>Abre o seu WhatsApp (+{whats}) com essa mensagem pronta.</> : 'Cadastre seu WhatsApp na Página inicial.'}</div>
                    </>
                  )}
                  {ed.botao_tipo === 'imovel' && (
                    <select value={ed.imovel_codigo || ''} onChange={e => set({ imovel_codigo: e.target.value })} style={{ ...caixa, appearance: 'auto' }}>
                      <option value="">Escolha o imóvel…</option>
                      {imoveis.map(i => <option key={i.codigo + i.slug} value={i.codigo}>{i.codigo} · {i.titulo}</option>)}
                    </select>
                  )}
                  {ed.botao_tipo === 'link' && <input value={ed.botao_url || ''} onChange={e => set({ botao_url: e.target.value })} placeholder="https://jassiara.com.br/imoveis?f=temporada" style={caixa} />}
                  {linkB && ed.botao_tipo !== 'whatsapp' && <div style={{ ...ajudaSt, display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}><Link2 size={13} /> {linkB}</div>}
                </div>
              )}
            </Passo>

            <Passo n="4" titulo="Depois disso">
              <Linha titulo="Secretária IA continua a conversa" ajuda="Só nesta conversa, só depois do gatilho. Se você mandar qualquer mensagem, ela para na hora.">
                <Chave ligado={ed.ia_assume} onClick={() => set({ ia_assume: !ed.ia_assume })} rotuloAria="Secretária IA" />
              </Linha>
              {ed.ia_assume && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={ajudaSt}>Por até</span>
                  {HORAS.map(h => <button key={h} onClick={() => set({ ia_horas: h })} style={{ padding: '7px 12px', borderRadius: 999, fontSize: 13, border: `1px solid ${ed.ia_horas === h ? 'var(--green)' : 'var(--line)'}`, background: ed.ia_horas === h ? 'rgba(168,192,143,.15)' : 'transparent', color: ed.ia_horas === h ? 'var(--green)' : 'var(--sand)', fontWeight: ed.ia_horas === h ? 700 : 500 }}>{h}h</button>)}
                </div>
              )}
              <Linha titulo="Uma vez por pessoa" ajuda="Se a mesma pessoa comentar de novo, não repete.">
                <Chave ligado={ed.uma_vez} onClick={() => set({ uma_vez: !ed.uma_vez })} rotuloAria="Uma vez por pessoa" />
              </Linha>
              <Linha titulo="Responder com calma" ajuda="Espera de 1 a 3 minutos, como uma pessoa.">
                <Chave ligado={ed.atraso} onClick={() => set({ atraso: !ed.atraso })} rotuloAria="Responder com calma" />
              </Linha>
            </Passo>

            <Passo n="5" titulo="Nome do gatilho">
              <input value={ed.nome || ''} onChange={e => set({ nome: e.target.value })} placeholder={`${C.curto}: ${(ed.palavras || [])[0] || 'QUERO'}`} style={caixa} />
            </Passo>
          </div>

          <div className="auto-previa" data-tour="previa">
            <Previa r={ed} linkBotao={linkB} />
          </div>
        </div>

        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 6, background: 'rgba(33,36,25,.96)', borderTop: '1px solid var(--line)', padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setEd(null)} style={{ flex: '0 1 160px', padding: 14, borderRadius: 12, border: '1px solid var(--line)', background: 'transparent', color: 'var(--sand)', fontWeight: 600 }}>Cancelar</button>
          <button onClick={salvar} disabled={salvando} style={{ flex: '0 1 320px', padding: 14, borderRadius: 12, border: 0, background: 'var(--accent)', color: '#22251A', fontWeight: 800, fontSize: 15 }}>{salvando ? 'Salvando…' : 'Salvar gatilho'}</button>
        </div>
        {msg && <div role="status" style={{ position: 'fixed', left: '50%', bottom: 92, transform: 'translateX(-50%)', zIndex: 7, background: '#F0E8DD', color: '#22251A', padding: '10px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,.4)', maxWidth: 'calc(100vw - 32px)', textAlign: 'center' }}>{msg}</div>}
        <TourGuiado aberto={tourEd} onFechar={fecharTourEd} passos={TOUR_EDITOR} />
        <style>{`.auto-grade{display:grid;gap:14px;grid-template-columns:1fr}.auto-previa{order:-1}@media(min-width:900px){.auto-grade{grid-template-columns:minmax(0,1fr) 340px;align-items:start}.auto-previa{order:0;position:sticky;top:84px}}`}</style>
      </main>
    );
  }

  // ─────────── LISTA ───────────
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)', paddingBottom: 40 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" aria-label="Voltar ao painel" style={{ width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(240,232,221,.15)', color: 'var(--sand)', display: 'grid', placeItems: 'center' }}><ChevronLeft size={20} /></Link>
        <strong style={{ fontSize: 17, flex: 1 }}>Automações</strong>
        <button onClick={() => { setAba('gatilhos'); setTourLista(true); }} style={btnAjuda}><CircleHelp size={16} /> Como funciona</button>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Interruptor geral + regra de ouro */}
        <section style={{ ...cartao, background: 'linear-gradient(160deg, #343826, #262919)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div data-tour="geral" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 44, height: 44, borderRadius: 12, background: ligadas ? 'rgba(168,192,143,.18)' : 'rgba(240,232,221,.08)', color: ligadas ? 'var(--green)' : 'var(--muted)', display: 'grid', placeItems: 'center', flex: 'none' }}><Power size={22} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{ligadas ? 'Automações ligadas' : 'Automações pausadas'}</div>
              <div style={ajudaSt}>{ligadas ? 'Os gatilhos ligados abaixo estão valendo.' : 'Nenhum gatilho dispara enquanto estiver pausado.'}</div>
            </div>
            <Chave ligado={ligadas} onClick={alternarGeral} rotuloAria="Ligar automações" />
          </div>
          <div data-tour="regra" style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 12, background: 'rgba(15,17,10,.35)' }}>
            <ShieldCheck size={20} color="var(--green)" style={{ flex: 'none', marginTop: 1 }} />
            <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--sand)' }}>
              <div><strong style={{ color: 'var(--cream-2)' }}>WhatsApp:</strong> a secretária atende, tira dúvidas, manda os imóveis e te chama quando o cliente quer visitar ou fechar.</div>
              <div style={{ marginTop: 6 }}><strong style={{ color: 'var(--cream-2)' }}>Instagram:</strong> só responde quem usar a palavra de um gatilho{secIg ? ', e a secretária atende o direct' : ''}. O resto é com você.</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 8 }}><Lock size={14} color="var(--accent)" style={{ flex: 'none', marginTop: 3 }} /><span><strong style={{ color: 'var(--cream-2)' }}>Você entrou, o robô sai.</strong> Se você mandar qualquer mensagem numa conversa, a automação e a secretária param na hora naquela conversa.</span></div>
            </div>
          </div>
          <div data-tour="canais" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['Instagram', Instagram, sIg], ['WhatsApp', MessageCircle, sWa]].map(([n, I, s]) => (
              <span key={n} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 999, border: '1px solid var(--line)', fontSize: 12.5, color: 'var(--sand)' }}>
                <I size={14} /> {n}: <strong style={{ color: s.c }}>{s.t}</strong>{n === 'Instagram' && cfg.instagram_usuario && cfg.auto_instagram_status === 'conectado' ? <span>· @{cfg.instagram_usuario}</span> : null}
              </span>
            ))}
            {cfg.auto_instagram_status !== 'conectado' && (
              igApp
                ? <button onClick={conectarInstagram} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 999, border: 0, background: 'linear-gradient(135deg,#F58529,#DD2A7B 55%,#8134AF)', color: '#fff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }}><Instagram size={14} /> Conectar Instagram</button>
                : <span style={{ fontSize: 12, color: 'var(--muted)', alignSelf: 'center' }}>Conexão do Instagram: aguardando o suporte liberar.</span>
            )}
          </div>
          <div data-tour="secretaria" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 14, borderRadius: 12, border: '1px solid rgba(168,192,143,.25)', background: 'rgba(168,192,143,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bot size={18} color="var(--green)" /><strong style={{ fontSize: 14.5 }}>Secretária IA</strong></div>
            <Linha titulo="Atende no WhatsApp" ajuda="Responde todo mundo que chamar, direciona e te chama.">
              <Chave ligado={secWa} onClick={() => alternarSecretaria('secretaria_whatsapp', secWa)} rotuloAria="Secretária no WhatsApp" />
            </Linha>
            <Linha titulo="Atende o direct do Instagram" ajuda="Desligado: no direct só respondem os gatilhos.">
              <Chave ligado={secIg} onClick={() => alternarSecretaria('secretaria_instagram', secIg)} rotuloAria="Secretária no direct do Instagram" />
            </Linha>
          </div>
        </section>

        {/* Abas */}
        <div style={{ display: 'flex', background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 12, padding: 4 }}>
          {[['gatilhos', 'Gatilhos', Zap], ['atividade', 'Atividade', Activity]].map(([k, l, I]) => (
            <button key={k} data-tour={'aba-' + k} onClick={() => setAba(k)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 6px', borderRadius: 9, border: 0, fontSize: 13.5, fontWeight: aba === k ? 800 : 500, background: aba === k ? 'var(--accent)' : 'transparent', color: aba === k ? '#22251A' : 'var(--sand)' }}>
              <I size={15} />{l}{k === 'atividade' && iaAtiva.length > 0 && <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: 'var(--green)', color: '#1d2016' }}>{iaAtiva.length}</span>}
            </button>
          ))}
        </div>

        {aba === 'gatilhos' && (
          <>
            <button data-tour="criar" onClick={() => abrir(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 14, border: '1.5px dashed rgba(201,162,126,.55)', background: 'rgba(201,162,126,.06)', color: 'var(--accent)', fontSize: 15, fontWeight: 800 }}>
              <Plus size={18} /> Criar gatilho
            </button>
            {regras.length === 0 && <div style={{ ...cartao, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Nenhum gatilho ainda.</div>}
            {regras.map((r, idx) => {
              const C = CANAIS[r.canal] || CANAIS.ig_comentario;
              return (
                <article key={r.id} data-tour={idx === 0 ? 'cartao' : undefined} style={{ ...cartao, display: 'flex', flexDirection: 'column', gap: 12, opacity: r.ativo ? 1 : 0.72 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ width: 42, height: 42, borderRadius: 11, background: C.cor + '22', color: C.cor, display: 'grid', placeItems: 'center', flex: 'none' }}><C.Icone size={20} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, color: C.cor, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{C.rotulo}</div>
                      <div style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--cream-2)', marginTop: 2 }}>{r.nome}</div>
                      <div style={{ fontSize: 13, color: 'var(--sand)', marginTop: 4 }}>{resumoQuando(r)}</div>
                    </div>
                    <Chave ligado={r.ativo} onClick={() => alternarRegra(r)} rotuloAria={`Ligar ${r.nome}`} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {acoesDe(r).map(a => <span key={a} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 999, background: a.startsWith('Secretária') ? 'rgba(168,192,143,.14)' : 'rgba(240,232,221,.07)', color: a.startsWith('Secretária') ? 'var(--green)' : 'var(--sand)' }}>{a}</span>)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--line)', paddingTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ ...ajudaSt, flex: '1 1 100%', display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={13} /> {r.disparos || 0} disparo{(r.disparos || 0) === 1 ? '' : 's'}{r.ultimo_disparo ? ` · último ${fmtQuando(r.ultimo_disparo)}` : ''}</span>
                    <button onClick={() => abrir(r)} style={btnPeq}><Pencil size={14} /> Editar</button>
                    <button onClick={() => duplicar(r)} style={btnPeq}><Copy size={14} /> Duplicar</button>
                    <button onClick={() => excluir(r)} style={{ ...btnPeq, color: '#d99a8a', borderColor: confirmaExcluir === r.id ? 'rgba(200,90,70,.6)' : 'var(--line)' }}><Trash2 size={14} /> {confirmaExcluir === r.id ? 'Confirmar' : 'Excluir'}</button>
                  </div>
                </article>
              );
            })}
          </>
        )}

        {aba === 'atividade' && (
          <>
            {iaAtiva.length > 0 && <div style={{ ...ajudaSt, color: 'var(--green)' }}>A secretária está conversando com {iaAtiva.length} pessoa{iaAtiva.length === 1 ? '' : 's'} agora.</div>}
            {eventos.length === 0 && (
              <div style={{ ...cartao, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', padding: 28 }}>
                <Sparkles size={26} color="var(--accent)" />
                <strong>Nenhum disparo ainda</strong>
                <span style={{ ...ajudaSt, maxWidth: 360 }}>Quando alguém usar uma palavra de gatilho, aparece aqui: quem foi, o que escreveu e o que foi enviado.</span>
              </div>
            )}
            {eventos.map(ev => {
              const C = CANAIS[ev.canal] || CANAIS.ig_comentario;
              const iaOn = ev.ia_ate && new Date(ev.ia_ate) > new Date();
              return (
                <article key={ev.id} style={{ ...cartao, display: 'flex', gap: 12, padding: 14 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: C.cor + '22', color: C.cor, display: 'grid', placeItems: 'center', flex: 'none' }}><C.Icone size={17} /></span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong style={{ fontSize: 14 }}>{ev.contato_nome || 'Cliente'}</strong>
                      <span style={{ ...ajudaSt, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {fmtQuando(ev.criado_em)}</span>
                    </div>
                    {ev.texto && <div style={{ fontSize: 13, color: 'var(--sand)' }}>“{ev.texto}”</div>}
                    <div style={ajudaSt}>{ev.automacao_nome || 'Gatilho'} · {(ev.acoes || []).join(' · ')}{ev.status !== 'ok' ? ` · ${ev.status}` : ''}</div>
                    {iaOn && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12.5, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5 }}><Bot size={14} /> Secretária na conversa até {new Date(ev.ia_ate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <button onClick={() => desligarIA(ev)} style={{ ...btnPeq, color: 'var(--accent)' }}>Assumir conversa</button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </>
        )}

      </div>
      <TourGuiado aberto={tourLista} onFechar={fecharTourLista} passos={TOUR_LISTA} />
      {msg && <div role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 7, background: '#F0E8DD', color: '#22251A', padding: '10px 16px', borderRadius: 999, fontSize: 13.5, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,.4)', maxWidth: 'calc(100vw - 32px)', textAlign: 'center' }}>{msg}</div>}
    </main>
  );
}

const btnAjuda = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(201,162,126,.45)', background: 'rgba(201,162,126,.08)', color: 'var(--accent)', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const btnPeq = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--line)', background: 'transparent', color: 'var(--sand)', fontSize: 12.5, fontWeight: 600 };
