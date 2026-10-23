'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ytId, ytEmbed, maskThousands, whatsappLink } from '../lib/format';
import FormWhats from './FormWhats';
import { semAcento, soLetrasNumeros, FILTROS_PADRAO, filtrosDaUrl, urlDosFiltros, lembrarBusca, lembrarRolagem, pegarRolagem } from '../lib/busca';
import CardImovel from './CardImovel';
import { SECOES, naSecao, COMERCIAIS } from '../lib/secoes';
import IconeWhats from './IconeWhats';

const LOGO = '/brand/logo-verde.png'; // site de imóveis é claro: logo verde
const QUARTOS = ['1', '2', '3', '4'];
const ORDENS = [
  { k: 'relevancia', label: 'Destaques' }, { k: 'menor', label: 'Menor preço' },
  { k: 'maior', label: 'Maior preço' }, { k: 'recentes', label: 'Mais recentes' }
];
const CATEGORIAS = ['Apartamento', 'Casa', 'Cobertura', 'Flat / Studio', 'Terreno', ...COMERCIAIS];
const MOBILIAS = [
  { k: 'todos', label: 'Todas' }, { k: 'mobiliado', label: 'Mobiliado' },
  { k: 'semi', label: 'Semimobiliado' }, { k: 'sem', label: 'Sem mobília' },
  { k: 'planejados', label: 'Com planejados' }
];

export default function PortalClient({ imoveis, heroVideo, heroVideoFile, heroFoto, whats, creci }) {
  // Todos os filtros num objeto só, espelhado no link (?f=aluguel&q=manaira...).
  // Assim a busca pode ser compartilhada e continua igual quando a pessoa volta de um imóvel.
  const [fl, setFl] = useState(FILTROS_PADRAO);
  const [pronto, setPronto] = useState(false);
  const set = (k) => (v) => setFl(o => ({ ...o, [k]: v }));
  const filter = fl.f, setFilter = set('f');
  const fBairro = fl.q, setFBairro = set('q');
  const fTipo = fl.tipo, setFTipo = set('tipo');
  const fMin = fl.min, setFMin = (v) => set('min')(String(v).replace(/\D/g, ''));
  const fMax = fl.max, setFMax = (v) => set('max')(String(v).replace(/\D/g, ''));
  const fMobilia = fl.mob, setFMobilia = set('mob');
  const fQuartos = fl.quartos, setFQuartos = set('quartos');
  const ordem = fl.ordem, setOrdem = set('ordem');
  const [showFilters, setShowFilters] = useState(false);
  const [heroPlaying, setHeroPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [formWa, setFormWa] = useState(false);
  const abrirForm = (e) => { e.preventDefault(); setFormWa(true); };
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)');
    const on = () => setIsMobile(mq.matches);
    on(); mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  // 1) ao abrir: lê os filtros do link e, se a pessoa está voltando de um imóvel, volta para o mesmo ponto da lista
  useEffect(() => {
    const inicial = filtrosDaUrl(window.location.search);
    setFl(inicial);
    setPronto(true);
    const query = urlDosFiltros(inicial);
    const y = pegarRolagem(query);
    const irPara = (fn) => requestAnimationFrame(() => setTimeout(fn, 60));
    if (y != null) irPara(() => window.scrollTo(0, y));
    else if (window.location.hash === '#lista' || query) irPara(() => {
      const el = document.getElementById('lista');
      if (el) window.scrollTo(0, el.offsetTop - 70);
    });
  }, []);

  // 2) a cada mudança: atualiza o link (sem recarregar) e guarda a busca para o "Voltar aos imóveis"
  const query = urlDosFiltros(fl);
  useEffect(() => {
    if (!pronto) return;
    try { window.history.replaceState(window.history.state, '', window.location.pathname + query); } catch (e) {}
    lembrarBusca(query);
  }, [pronto, query]);

  const heroYt = ytId(heroVideo);
  const temVideo = !!(heroVideoFile || heroYt);
  const wa = whatsappLink('Olá! Vi um imóvel no site e tenho interesse.', whats);
  const goToList = (f) => {
    setFilter(f);
    const el = document.getElementById('lista');
    if (el) window.scrollTo({ top: el.offsetTop - 70, behavior: 'smooth' });
  };

  const num = (v) => { const n = String(v).replace(/\D/g, ''); return n ? Number(n) : null; };
  const pMin = num(fMin), pMax = num(fMax), nQuartos = num(fQuartos);
  // busca sem acento ("manaira" acha "Manaíra"); no mesmo campo aceita código: jdv-1019, jdv1019 ou só 1019
  const bairroQ = semAcento(fBairro);
  const codQ = soLetrasNumeros(fBairro);
  const matchImovel = (i) => {
    if (!bairroQ) return true;
    if (semAcento(i.bairro).includes(bairroQ)) return true;
    if (semAcento(i.titulo).includes(bairroQ)) return true;
    return !!codQ && soLetrasNumeros(i.codigo).includes(codQ);
  };

  // bairros que existem nos imóveis ativos, do que tem mais imóveis para o que tem menos
  const bairros = useMemo(() => {
    // agrupa grafias diferentes do mesmo bairro ("Camboinha" e "CAMBOINHA") e mostra a que não está toda em maiúsculas
    const grupos = {};
    imoveis.forEach(i => {
      const b = (i.bairro || '').trim(); if (!b) return;
      const k = semAcento(b);
      const g = grupos[k] || (grupos[k] = { nome: b, n: 0 });
      g.n += 1;
      if (g.nome === g.nome.toUpperCase() && b !== b.toUpperCase()) g.nome = b;
    });
    const titulo = (t) => t === t.toUpperCase() ? t.toLowerCase().replace(/(^|\s)(\S)/g, (m, e, l) => e + l.toUpperCase()) : t;
    return Object.values(grupos).sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome)).map(g => titulo(g.nome));
  }, [imoveis]);

  const lista = useMemo(() => {
    const r = imoveis
      .filter(i => naSecao(i, filter))
      .filter(matchImovel)
      .filter(i => fTipo === 'todos' || i.categoria === fTipo)
      .filter(i => pMin == null || i.preco_cents >= pMin * 100)
      .filter(i => pMax == null || i.preco_cents <= pMax * 100)
      .filter(i => fMobilia === 'todos' || i.mobilia === fMobilia)
      .filter(i => nQuartos == null || (i.quartos || 0) >= nQuartos);
    if (ordem === 'menor') r.sort((a, b) => (a.preco_cents || 0) - (b.preco_cents || 0));
    else if (ordem === 'maior') r.sort((a, b) => (b.preco_cents || 0) - (a.preco_cents || 0));
    else if (ordem === 'recentes') r.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    return r;
  }, [imoveis, filter, bairroQ, codQ, fTipo, pMin, pMax, fMobilia, nQuartos, ordem]);

  const activeCount = [fTipo !== 'todos', fMobilia !== 'todos', !!bairroQ, pMin != null, pMax != null, nQuartos != null].filter(Boolean).length;
  const limparFiltros = () => setFl(o => ({ ...FILTROS_PADRAO, f: o.f, ordem: o.ordem }));

  return (
    <div className="tema-claro" style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)' }}>
      {/* HEADER */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'color-mix(in srgb, var(--bg) 92%, transparent)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)' }}>
        <div className="container cab-home" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={LOGO} alt="Jassiara Vasconcelos" style={{ height: isMobile ? 30 : 36, width: 'auto'  }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 28 }}>
            {/* escondido no celular pelo CSS (classe so-pc), para já abrir certo antes do JavaScript carregar */}
            <nav className="so-pc" style={{ display: 'flex', gap: 26, fontSize: 14, color: 'var(--sand)' }}>
              <button onClick={() => goToList('temporada')} style={navLink}>Temporada</button>
              <button onClick={() => goToList('anual')} style={navLink}>Alugar</button>
              <button onClick={() => goToList('venda')} style={navLink}>Comprar</button>
              <button onClick={() => goToList('todos')} style={navLink}>Imóveis</button>
            </nav>
            <a href={wa} target="_blank" rel="noopener" onClick={abrirForm} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--wa)', color: 'var(--wa-texto)', padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 800 }}>
              <IconeWhats size={16} />WhatsApp
            </a>
            <Link href="/admin/login" title="Área do corretor" aria-label="Área do corretor"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 999, border: '1px solid color-mix(in srgb, var(--cream) 14%, transparent)', color: 'var(--muted)', flex: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO — com foto dela (padrão) ou vídeo, se configurado em site_config.hero_video / hero_video_file */}
      <section className={`hero-im${temVideo ? ' com-video' : heroFoto ? ' tem-foto' : ''}`} style={{ position: 'relative', minHeight: isMobile ? 'auto' : temVideo ? 'min(94vh, 800px)' : 'min(88vh, 760px)', background: heroYt ? `#22251A url("https://i.ytimg.com/vi/${heroYt}/hqdefault.jpg") center/cover` : 'radial-gradient(120% 90% at 85% 15%, #FAF6F0 0%, #F0E8DD 48%, #E4D9C7 100%)', overflow: 'hidden', display: 'flex' }}>
        {!temVideo && <img src="/brand/emblema-verde.png" alt="" aria-hidden="true" className="hero-marca" />}
        {!temVideo && heroFoto && <img src={heroFoto} alt="Jassiara Vasconcelos" className="hero-foto" fetchPriority="high" />}
        {heroVideoFile && (
          <video src={heroVideoFile} autoPlay muted loop playsInline preload="auto"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', minWidth: '100%', minHeight: '100%', objectFit: 'cover', border: 0 }} />
        )}
        {!heroVideoFile && heroYt && !heroPlaying && !isMobile && origin && (
          <iframe src={ytEmbed(heroYt, { controls: 0, origin })} referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100vw', height: '56.25vw', minHeight: '100%', minWidth: '177.78vh', border: 0, pointerEvents: 'none' }} title="Vídeo em destaque" />
        )}
        {!heroPlaying && temVideo && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to top, var(--bg) 4%, color-mix(in srgb, var(--bg) 55%, transparent) 32%, transparent 70%), linear-gradient(to right, color-mix(in srgb, var(--bg) 92%, transparent) 0%, color-mix(in srgb, var(--bg) 55%, transparent) 50%, transparent 78%)' }} />
        )}
        {!heroVideoFile && heroYt && heroPlaying && (
          <iframe src={ytEmbed(heroYt, { mute: 0, controls: 1, loop: 0, origin })} referrerPolicy="strict-origin-when-cross-origin"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, zIndex: 3 }} allow="autoplay; encrypted-media" allowFullScreen title="Tour em destaque" />
        )}
        {!heroPlaying && (
          <div className="container" style={{ position: 'relative', zIndex: 2, alignSelf: 'flex-end', width: '100%', padding: isMobile ? '0 20px 32px' : '0 56px 56px' }}>
            <div className="hero-texto" style={{ paddingTop: isMobile ? 34 : 90 }}>
              <div style={{ display: 'inline-flex', gap: 8, fontSize: 10.5, letterSpacing: '.2em', color: 'var(--caramelo)', border: '1px solid color-mix(in srgb, var(--caramelo) 50%, transparent)', padding: '6px 12px', borderRadius: 999, marginBottom: 18 }}>JOÃO PESSOA · PB</div>
              <h1 style={{ fontSize: 'clamp(27px, 4vw, 50px)', lineHeight: 1.12, color: 'var(--cream-2)', margin: 0 }}>Seu próximo endereço em João Pessoa começa aqui</h1>
              <p style={{ fontSize: 'clamp(14px, 1.6vw, 16.5px)', color: 'var(--sand)', marginTop: 14, maxWidth: 460, lineHeight: 1.55 }}>Temporada, locação e compra, com tour em vídeo de cada imóvel e atendimento direto comigo.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => goToList('anual')} style={{ background: 'var(--accent)', color: 'var(--on-accent)', padding: isMobile ? '12px 16px' : '13px 24px', borderRadius: 8, fontSize: 14, fontWeight: 700, border: 0, cursor: 'pointer' }}>{isMobile ? 'Alugar' : 'Ver imóveis para alugar'}</button>
                <button onClick={() => goToList('venda')} style={{ border: '1px solid color-mix(in srgb, var(--cream) 35%, transparent)', background: 'transparent', color: 'var(--cream)', padding: isMobile ? '12px 16px' : '13px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{isMobile ? 'Comprar' : 'À venda'}</button>
                {!heroVideoFile && heroYt && <button onClick={() => setHeroPlaying(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 0, color: 'var(--cream)', fontSize: 13, cursor: 'pointer' }}><span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 999, background: 'color-mix(in srgb, var(--bg-2) 80%, transparent)', border: '1px solid color-mix(in srgb, var(--cream) 30%, transparent)' }}>▶</span> Assistir com som</button>}
              </div>
            </div>

            {/* BUSCA */}
            <div className="hero-busca" style={{ marginTop: 26, background: 'color-mix(in srgb, var(--bg-2) 90%, transparent)', backdropFilter: 'blur(10px)', border: '1px solid var(--line)', borderRadius: 16, padding: isMobile ? 14 : '18px 20px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 18px 50px rgba(70,62,44,.14)' }}>
              <div style={{ display: 'flex', gap: isMobile ? 10 : 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={buscaLabel}>QUERO</div>
                  <div style={{ display: 'flex', background: 'var(--bg-2)', borderRadius: 11, padding: 3, border: '1px solid color-mix(in srgb, var(--cream) 12%, transparent)' }}>
                    {[['temporada', 'Temporada'], ['anual', 'Alugar'], ['venda', 'Comprar']].map(([k, l]) => (
                      <button key={k} onClick={() => setFilter(k)} style={{ flex: 1, padding: '11px 6px', borderRadius: 9, border: 0, fontSize: 13.5, fontWeight: filter === k ? 700 : 500, background: filter === k ? 'var(--accent)' : 'transparent', color: filter === k ? '#22251A' : 'var(--sand)', cursor: 'pointer' }}>{l}</button>
                    ))}
                  </div>
                </div>

                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={buscaLabel}>BAIRRO OU CÓDIGO</div>
                  <input value={fBairro} onChange={e => setFBairro(e.target.value)} list="jd-bairros" placeholder={isMobile ? 'Bairro ou JSA-100' : 'ex.: Cabo Branco ou JSA-100'} style={buscaField} enterKeyHint="search" onKeyDown={e => { if (e.key === 'Enter') goToList(filter); }} />
                  <datalist id="jd-bairros">{bairros.map(b => <option key={b} value={b} />)}</datalist>
                </div>

                <div style={{ flex: isMobile ? '1 1 130px' : '1 1 200px', minWidth: 0 }}>
                  <div style={buscaLabel}>TIPO DE IMÓVEL</div>
                  <select value={fTipo} onChange={e => setFTipo(e.target.value)} style={buscaField}>
                    <option value="todos">Todos os tipos</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div style={{ flex: isMobile ? '1 1 100px' : '1 1 120px', minWidth: 0 }}>
                  <div style={buscaLabel}>QUARTOS</div>
                  <select value={fQuartos} onChange={e => setFQuartos(e.target.value)} style={buscaField}>
                    <option value="">Qualquer</option>
                    {QUARTOS.map(q => <option key={q} value={q}>{q}+ quarto{q === '1' ? '' : 's'}</option>)}
                  </select>
                </div>

                <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                  <div style={buscaLabel}>FAIXA DE VALOR</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ ...buscaField, display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, padding: '0 12px' }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>R$</span>
                      <input value={maskThousands(fMin)} onChange={e => setFMin(e.target.value)} placeholder="mín." inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, padding: '13px 0', fontSize: 15, color: 'var(--cream)' }} />
                    </div>
                    <div style={{ ...buscaField, display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0, padding: '0 12px' }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>R$</span>
                      <input value={maskThousands(fMax)} onChange={e => setFMax(e.target.value)} placeholder="máx." inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, padding: '13px 0', fontSize: 15, color: 'var(--cream)' }} />
                    </div>
                  </div>
                </div>

                <button onClick={() => goToList(filter)} style={{ flex: isMobile ? '1 1 100%' : '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--accent)', color: 'var(--on-accent)', border: 0, borderRadius: 11, padding: '15px 24px', fontSize: 14.5, fontWeight: 700, cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  Ver {lista.length} {lista.length === 1 ? 'imóvel' : 'imóveis'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: 'var(--muted)' }}>
                <span>Bairros:</span>
                {bairros.slice(0, isMobile ? 4 : 7).map(b => {
                  const sel = semAcento(fBairro) === semAcento(b);
                  return (
                    <button key={b} onClick={() => { setFBairro(sel ? '' : b); goToList(filter); }}
                      style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', border: `1px solid ${sel ? 'var(--accent)' : 'color-mix(in srgb, var(--cream) 18%, transparent)'}`, background: sel ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--sand)' }}>{b}</button>
                  );
                })}
                <button onClick={() => { setShowFilters(true); goToList(filter); }} style={{ background: 'transparent', border: 0, color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>mais filtros →</button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* LISTA */}
      <section id="lista" className="container" style={{ padding: isMobile ? '28px 20px 40px' : '36px 56px 56px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
          <h2 style={{ fontSize: 24, color: 'var(--cream-2)', margin: 0 }}>Imóveis disponíveis <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'Karla, system-ui, sans-serif' }}>({lista.length})</span></h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={ordem} onChange={e => setOrdem(e.target.value)} aria-label="Ordenar"
              style={{ ...chip(ordem !== 'relevancia'), appearance: 'none', paddingRight: 28, background: `${ordem !== 'relevancia' ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent'} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23888270'/%3E%3C/svg%3E") no-repeat right 11px center` }}>
              {ORDENS.map(o => <option key={o.k} value={o.k} style={{ color: 'var(--on-accent)' }}>{o.k === 'relevancia' ? 'Ordenar: destaques' : o.label}</option>)}
            </select>
            {SECOES.map(({ k: f, label }) => (
              <button key={f} onClick={() => setFilter(f)} style={chip(filter === f)}>
                {label}
              </button>
            ))}
            <button onClick={() => setShowFilters(v => !v)} style={{ ...chip(false), borderColor: 'color-mix(in srgb, var(--accent) 45%, transparent)', color: 'var(--accent)' }}>
              Filtros {activeCount > 0 ? `(${activeCount})` : ''}
            </button>
          </div>
        </div>

        {showFilters && (
          <div style={{ background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--cream) 10%, transparent)', borderRadius: 16, padding: 20, marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Group label="BAIRRO OU CÓDIGO">
              <input value={fBairro} onChange={e => setFBairro(e.target.value)} placeholder="Bairro ou código… ex.: Cabo Branco, JSA-100" style={inp} />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
                {bairros.map(b => { const sel = semAcento(fBairro) === semAcento(b); return <button key={b} onClick={() => setFBairro(sel ? '' : b)} style={chip(sel)}>{b}</button>; })}
              </div>
            </Group>
            <Group label="FAIXA DE VALOR">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid color-mix(in srgb, var(--cream) 15%, transparent)', borderRadius: 12, padding: '0 14px', flex: '1 1 130px', maxWidth: 200 }}>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>R$</span>
                  <input value={maskThousands(fMin)} onChange={e => setFMin(e.target.value)} placeholder="mínimo" inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, padding: '13px 0', fontSize: 16, color: 'var(--cream)' }} />
                </div>
                <span style={{ color: 'var(--muted)' }}>até</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid color-mix(in srgb, var(--cream) 15%, transparent)', borderRadius: 12, padding: '0 14px', flex: '1 1 130px', maxWidth: 200 }}>
                  <span style={{ fontSize: 14, color: 'var(--muted)' }}>R$</span>
                  <input value={maskThousands(fMax)} onChange={e => setFMax(e.target.value)} placeholder="máximo" inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, padding: '13px 0', fontSize: 16, color: 'var(--cream)' }} />
                </div>
              </div>
            </Group>
            <Group label="QUARTOS">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button onClick={() => setFQuartos('')} style={chip(!fQuartos)}>Qualquer</button>
                {QUARTOS.map(q => <button key={q} onClick={() => setFQuartos(q)} style={chip(fQuartos === q)}>{q}+</button>)}
              </div>
            </Group>
            <Group label="TIPO DE IMÓVEL">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button onClick={() => setFTipo('todos')} style={chip(fTipo === 'todos')}>Todos</button>
                {CATEGORIAS.map(c => <button key={c} onClick={() => setFTipo(c)} style={chip(fTipo === c)}>{c}</button>)}
              </div>
            </Group>
            <Group label="MOBÍLIA">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {MOBILIAS.map(m => <button key={m.k} onClick={() => setFMobilia(m.k)} style={chip(fMobilia === m.k)}>{m.label}</button>)}
              </div>
            </Group>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--sand)' }}>{lista.length} {lista.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}</span>
              {activeCount > 0 && <button onClick={limparFiltros} style={{ background: 'transparent', border: 0, color: 'var(--accent)', fontSize: 12.5, fontWeight: 600 }}>Limpar filtros</button>}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(auto-fill,minmax(210px,1fr))', gap: isMobile ? 12 : 20 }}>
          {lista.map((im, i) => <CardImovel key={im.id} im={im} compacto={isMobile} autoVideo umPorVez origin={origin} priority={i < 4} onAbrir={() => lembrarRolagem(query)} />)}
        </div>
        {lista.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>
            Nenhum imóvel encontrado com esses filtros.
            {activeCount > 0 && <div><button onClick={limparFiltros} style={{ marginTop: 12, background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', borderRadius: 999, padding: '8px 16px', fontSize: 13 }}>Limpar filtros</button></div>}
          </div>
        )}
      </section>

      {/* COMO FUNCIONA */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '40px 0' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 28 }}>
          {[['1', 'Assista ao tour', 'Vídeo de cada imóvel, cômodo por cômodo, sem surpresas.'],
            ['2', 'Gostou? Me chame no WhatsApp', 'Atendimento direto comigo, do primeiro contato às chaves.'],
            ['3', 'Visite só o que vale a pena', 'Você chega na visita já decidido — sem perder tempo.']].map(([n, t, d]) => (
            <div key={n} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="serif" style={{ fontSize: 26, color: 'var(--accent)' }}>{n}</span>
              <strong style={{ fontSize: 15, color: 'var(--cream-2)' }}>{t}</strong>
              <span style={{ fontSize: 13.5, color: 'var(--taupe)', lineHeight: 1.55 }}>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: isMobile ? '24px 20px 32px' : '24px 56px', color: 'var(--muted)', fontSize: 12.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={LOGO} alt="Jassiara Vasconcelos" style={{ height: 24, width: 'auto'  }} />
          <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.06em' }}>{creci ? `CRECI ${creci}` : ''}</span>
        </span>
        <span>João Pessoa · PB — Imóveis, temporada e oportunidades</span>
        <Link href="/admin/login" style={{ fontSize: 11.5, color: 'var(--muted)' }}>Área do corretor</Link>
      </footer>
      <FormWhats aberto={formWa} onFechar={() => setFormWa(false)} im={null} wa={wa} />
    </div>
  );
}

const chip = (sel) => ({
  padding: '8px 15px', borderRadius: 999, fontSize: 12.5, fontWeight: sel ? 700 : 400,
  background: sel ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent', color: sel ? 'var(--accent)' : 'var(--cream)',
  border: `1px solid ${sel ? 'var(--accent)' : 'color-mix(in srgb, var(--cream) 20%, transparent)'}`, cursor: 'pointer'
});
const navLink = {
  background: 'transparent', border: 0, color: 'var(--sand)', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit'
};
const buscaLabel = { fontSize: 10, fontWeight: 700, letterSpacing: '.14em', color: 'var(--taupe)', marginBottom: 6 };
const buscaField = { width: '100%', boxSizing: 'border-box', background: 'var(--bg-2)', border: '1px solid color-mix(in srgb, var(--cream) 12%, transparent)', borderRadius: 11, padding: '13px 12px', fontSize: 15, color: 'var(--cream)', appearance: 'none' };
const inp = {
  width: '100%', maxWidth: 420, background: 'var(--bg)', border: '1px solid color-mix(in srgb, var(--cream) 15%, transparent)',
  borderRadius: 12, padding: '13px 16px', fontSize: 16, color: 'var(--cream)'
};
function Group({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: 'var(--taupe)' }}>{label}</span>
      {children}
    </div>
  );
}
