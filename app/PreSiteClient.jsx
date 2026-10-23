'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase-browser';
import { ICONES, IconeServico } from './icones';

// Pré-site Jassiara Vasconcelos · Facilitadora de negócios.
// Paleta da marca: creme #F0E8DD, verde oliva #5F6348, caramelo #B18A69, bege #DDD5C6.
// Botão "site" abre o site de imóveis já filtrado; "whatsapp" abre a conversa com a mensagem pronta; "link" abre a URL.
const VERDE = '#5F6348';
const CARAMELO = '#B18A69';

function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }

function hrefDoBotao(b, whats) {
  if (b.tipo === 'site') return `/imoveis${b.destino ? `?f=${encodeURIComponent(b.destino)}` : ''}`;
  if (b.tipo === 'link') return b.destino || '#';
  const n = soDigitos(whats);
  const texto = b.mensagem || `Olá! Vim pelo seu site e quero saber sobre ${b.rotulo}.`;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : '#';
}

function IconeWhatsLinha({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

export default function PreSiteClient({ cfg, botoes }) {
  const [entrou, setEntrou] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntrou(true), 30); return () => clearTimeout(t); }, []);

  const cor = /^#[0-9a-f]{6}$/i.test(cfg.presite_cor_primaria || '') ? cfg.presite_cor_primaria : VERDE;
  const cor2 = /^#[0-9a-f]{6}$/i.test(cfg.presite_cor_secundaria || '') ? cfg.presite_cor_secundaria : CARAMELO;
  const whats = cfg.presite_whatsapp || '';
  const insta = (cfg.presite_instagram || '').replace(/^@/, '');
  const foto = cfg.presite_foto_url || '';
  const retrato = cfg.presite_retrato_url || ''; // foto dela recortada (PNG/WebP sem fundo) ao lado do logo
  const logo = cfg.presite_logo_url || '/brand/logo-verde.png';
  const nome = cfg.presite_titulo || 'Jassiara Vasconcelos';

  function clicou(b) {
    try { createClient().rpc('presite_clique', { p_id: b.id }); } catch (e) { /* contador é opcional */ }
    try { window.fbq && window.fbq('trackCustom', 'CliqueServico', { servico: b.rotulo }); } catch (e) {}
    try { window.gtag && window.gtag('event', 'clique_servico', { servico: b.rotulo }); } catch (e) {}
  }

  return (
    <main className={`ps ${retrato ? 'com-retrato' : foto ? 'com-foto' : ''}`} style={{ '--ps-cor': cor, '--ps-cor2': cor2 }}>
      {foto && !retrato
        ? <div className="ps-foto" style={{ backgroundImage: `url(${foto})` }} aria-hidden="true" />
        : <img src="/brand/emblema-verde.png" alt="" className="ps-marcadagua" aria-hidden="true" />}

      <div className="ps-conteudo">
        <header className={`ps-topo ${entrou ? 'on' : ''}`}>
          {retrato && <img src={retrato} alt={nome} className="ps-retrato" />}
          <div className="ps-marca">
            <img src={logo} alt={`${nome} · Facilitadora de negócios`} className="ps-logo" />
            {cfg.presite_subtitulo && <p className="ps-sub">{cfg.presite_subtitulo}</p>}
          </div>
        </header>
        <div className="ps-pergunta"><span />Do que você precisa hoje?<span /></div>

        <nav className="ps-lista" aria-label="Serviços">
          {botoes.map((b, i) => {
            const href = hrefDoBotao(b, whats);
            const externo = b.tipo !== 'site';
            return (
              <a key={b.id} href={href} onClick={() => clicou(b)}
                {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`ps-botao ${entrou ? 'on' : ''}`} style={{ transitionDelay: `${150 + i * 50}ms` }}>
                <span className="ps-icone" aria-hidden="true"><IconeServico nome={b.icone} size={21} /></span>
                <span className="ps-texto">
                  <span className="ps-rotulo">{b.rotulo}</span>
                  {b.subtitulo && <span className="ps-subrotulo">{b.subtitulo}</span>}
                </span>
                <span className="ps-seta" aria-hidden="true">{b.tipo === 'whatsapp' ? <IconeWhatsLinha size={18} /> : <ICONES.seta size={20} strokeWidth={1.8} />}</span>
              </a>
            );
          })}
        </nav>

        <footer className="ps-rodape">
          <img src="/brand/emblema-verde.png" alt="" className="ps-emblema" aria-hidden="true" />
          <div className="ps-redes">
            {soDigitos(whats) && <a href={`https://wa.me/${soDigitos(whats)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><IconeWhatsLinha size={19} /></a>}
            {insta && <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram"><ICONES.instagram size={19} strokeWidth={1.8} /></a>}
          </div>
          <div className="ps-legal">{nome} · Facilitadora de negócios{cfg.presite_creci ? ` · CRECI ${cfg.presite_creci}` : ''}</div>
        </footer>
      </div>

      <style jsx global>{`
        body { background: #F0E8DD; }
        .ps { position: relative; min-height: 100svh; color: #3E4130; background: #F0E8DD; overflow-x: hidden; }
        .ps-marcadagua { position: absolute; top: -4vh; right: -18vw; width: min(95vw, 620px); opacity: .09; pointer-events: none; }
        .ps-foto { position: relative; height: 56svh; min-height: 340px; background-size: cover; background-position: center 20%; }
        .ps-foto::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(240,232,221,0) 45%, rgba(240,232,221,.75) 80%, #F0E8DD 100%); }
        .ps-conteudo { position: relative; z-index: 1; max-width: 560px; margin: 0 auto; padding: 0 18px 30px; display: flex; flex-direction: column; min-height: 100svh; }
        .com-foto .ps-conteudo { min-height: auto; margin-top: -84px; }
        .ps-topo { padding: 11vh 4px 20px; text-align: center; opacity: 0; transform: translateY(10px); transition: opacity .7s ease, transform .7s ease; }
        .com-foto .ps-topo { padding-top: 0; }
        .ps-topo.on { opacity: 1; transform: none; }
        .ps-logo { width: min(84%, 340px); height: auto; margin: 0 auto; }
        .ps-sub { margin: 16px auto 0; max-width: 360px; font-size: 15px; line-height: 1.55; color: #5C5D4C; }
        .ps-pergunta { margin: 6px auto 14px; width: 100%; white-space: nowrap; display: flex; align-items: center; gap: 12px; justify-content: center; font-size: 11.5px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--ps-cor2); }
        .ps-pergunta span { flex: 0 1 46px; height: 1px; background: color-mix(in srgb, var(--ps-cor2) 60%, transparent); }
        .ps-lista { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .ps-botao { display: flex; align-items: center; gap: 14px; padding: 13px 15px; border-radius: 16px; text-decoration: none; color: #3E4130;
          background: #F8F3EB; border: 1px solid #DDD5C6; box-shadow: 0 1px 0 rgba(255,255,255,.7) inset, 0 6px 18px -14px rgba(62,65,48,.5);
          opacity: 0; transform: translateY(12px); transition: opacity .5s ease, transform .5s ease, border-color .2s, background .2s, box-shadow .2s; }
        .ps-botao.on { opacity: 1; transform: none; }
        .ps-botao:hover, .ps-botao:active { border-color: var(--ps-cor2); background: #FBF8F2; color: #3E4130; box-shadow: 0 10px 24px -16px rgba(62,65,48,.6); }
        .ps-icone { flex: 0 0 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; color: #F0E8DD; background: var(--ps-cor); }
        .ps-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .ps-rotulo { font-size: 16px; font-weight: 700; line-height: 1.25; color: #3E4130; }
        .ps-subrotulo { font-size: 12.5px; color: #85826F; line-height: 1.35; }
        .ps-seta { flex: 0 0 auto; color: var(--ps-cor2); display: flex; }
        .ps-rodape { margin-top: auto; padding-top: 34px; text-align: center; }
        .ps-emblema { width: 34px; margin: 0 auto 14px; opacity: .85; }
        .ps-redes { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; }
        .ps-redes a { width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: var(--ps-cor); border: 1px solid #CFC6B5; background: #F8F3EB; }
        .ps-legal { font-size: 11.5px; color: #8E8A76; letter-spacing: .04em; }
        /* com retrato: ela à direita, logo e frase à esquerda por cima do creme */
        .com-retrato .ps-topo { position: relative; display: flex; flex-direction: column; justify-content: flex-end; min-height: min(118vw, 560px); padding: 18px 0 18px; text-align: left; }
        .ps-retrato { position: absolute; right: -10px; top: 10px; height: calc(100% - 4px); max-width: 74%; object-fit: contain; object-position: right bottom;
          -webkit-mask-image: linear-gradient(180deg, #000 62%, transparent 99%); mask-image: linear-gradient(180deg, #000 62%, transparent 99%); }
        .com-retrato .ps-marca { position: relative; z-index: 1; max-width: 58%; }
        .com-retrato .ps-logo { width: 100%; margin: 0; filter: drop-shadow(0 2px 10px rgba(240,232,221,.9)); }
        .com-retrato .ps-sub { margin: 10px 0 0; max-width: 230px; font-size: 13.5px; text-shadow: 0 0 12px #F0E8DD, 0 0 4px #F0E8DD; }
        .com-retrato .ps-marcadagua { right: auto; left: -28vw; opacity: .07; }
        @media (min-width: 900px) {
          .com-retrato .ps-topo { min-height: 520px; justify-content: center; padding: 30px 0; }
          .com-retrato .ps-marca { max-width: 50%; }
          .com-retrato .ps-logo { width: 420px; max-width: 100%; }
          .com-retrato .ps-sub { max-width: 380px; font-size: 16px; }
          .ps-retrato { right: 0; max-width: 46%; height: 100%; top: 0; }
          .com-retrato .ps-marcadagua { left: -6vw; }
          .ps-conteudo { max-width: 920px; }
          .ps-topo { padding-top: 9vh; }
          .ps-logo { width: 380px; }
          .ps-lista { grid-template-columns: 1fr 1fr; gap: 12px; }
          .ps-marcadagua { right: 2vw; top: -6vh; width: 560px; }
          .ps-foto { height: 62vh; }
        }
        @media (prefers-reduced-motion: reduce) { .ps-topo, .ps-botao { transition: none; opacity: 1; transform: none; } }
      `}</style>
    </main>
  );
}
