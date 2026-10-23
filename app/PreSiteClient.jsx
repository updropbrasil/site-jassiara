'use client';
import { useEffect, useState } from 'react';
import { createClient } from '../lib/supabase-browser';
import IconeWhats from './IconeWhats';

// Pré-site Facilite: foto dela de fundo, marca e um botão por serviço.
// Botão "site" abre o site de imóveis já filtrado; "whatsapp" abre a conversa com a mensagem pronta; "link" abre a URL.
const COR_PADRAO = '#D4A55A';

function soDigitos(v) { return String(v || '').replace(/\D/g, ''); }

function hrefDoBotao(b, whats) {
  if (b.tipo === 'site') return `/imoveis${b.destino ? `?f=${encodeURIComponent(b.destino)}` : ''}`;
  if (b.tipo === 'link') return b.destino || '#';
  const n = soDigitos(whats);
  const texto = b.mensagem || `Olá! Vim pelo seu site e quero saber sobre ${b.rotulo}.`;
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : '#';
}

export default function PreSiteClient({ cfg, botoes }) {
  const [entrou, setEntrou] = useState(false);
  useEffect(() => { const t = setTimeout(() => setEntrou(true), 30); return () => clearTimeout(t); }, []);

  const cor = /^#[0-9a-f]{6}$/i.test(cfg.presite_cor_primaria || '') ? cfg.presite_cor_primaria : COR_PADRAO;
  const whats = cfg.presite_whatsapp || '';
  const insta = (cfg.presite_instagram || '').replace(/^@/, '');
  const foto = cfg.presite_foto_url || '';
  const logo = cfg.presite_logo_url || '';
  const marca = cfg.presite_titulo || cfg.presite_marca || 'Facilite';
  const nome = cfg.presite_nome || '';

  function clicou(b) {
    try { createClient().rpc('presite_clique', { p_id: b.id }); } catch (e) { /* contador é opcional */ }
    try { window.fbq && window.fbq('trackCustom', 'CliqueServico', { servico: b.rotulo }); } catch (e) {}
    try { window.gtag && window.gtag('event', 'clique_servico', { servico: b.rotulo }); } catch (e) {}
  }

  return (
    <main className="ps" style={{ '--ps-cor': cor }}>
      <div className="ps-fundo" style={foto ? { backgroundImage: `url(${foto})` } : undefined} aria-hidden="true" />
      <div className="ps-veu" aria-hidden="true" />

      <div className="ps-conteudo">
        <header className={`ps-topo ${entrou ? 'on' : ''}`}>
          <span className="ps-selo">Facilitadora de negócios · João Pessoa</span>
          {logo
            ? <img src={logo} alt={marca} className="ps-logo" />
            : <h1 className="ps-marca">{marca}</h1>}
          {nome && <div className="ps-nome">com <strong>{nome}</strong></div>}
          {cfg.presite_subtitulo && <p className="ps-sub">{cfg.presite_subtitulo}</p>}
          <div className="ps-pergunta">Do que você precisa hoje?</div>
        </header>

        <nav className="ps-lista" aria-label="Serviços">
          {botoes.map((b, i) => {
            const href = hrefDoBotao(b, whats);
            const externo = b.tipo !== 'site';
            return (
              <a key={b.id} href={href} onClick={() => clicou(b)}
                {...(externo ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`ps-botao ${entrou ? 'on' : ''}`} style={{ transitionDelay: `${120 + i * 55}ms` }}>
                <span className="ps-icone" aria-hidden="true">{b.icone || '✦'}</span>
                <span className="ps-texto">
                  <span className="ps-rotulo">{b.rotulo}</span>
                  {b.subtitulo && <span className="ps-subrotulo">{b.subtitulo}</span>}
                </span>
                <span className="ps-seta" aria-hidden="true">{b.tipo === 'whatsapp' ? <IconeWhats size={18} /> : '›'}</span>
              </a>
            );
          })}
        </nav>

        <footer className="ps-rodape">
          <div className="ps-redes">
            {soDigitos(whats) && <a href={`https://wa.me/${soDigitos(whats)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><IconeWhats size={20} /></a>}
            {insta && (
              <a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
              </a>
            )}
          </div>
          <div className="ps-legal">{marca}{nome ? ` · ${nome}` : ''}{cfg.presite_creci ? ` · CRECI ${cfg.presite_creci}` : ''}</div>
        </footer>
      </div>

      <style jsx global>{`
        .ps { position: relative; min-height: 100svh; color: #FBF6EF; background: #170E13; overflow-x: hidden; }
        .ps-fundo { position: fixed; inset: 0; background: radial-gradient(120% 70% at 50% 0%, #5A2A44 0%, #2A1420 45%, #170E13 100%); background-size: cover; background-position: center top; transform: scale(1.02); }
        .ps-veu { position: fixed; inset: 0; background: linear-gradient(180deg, rgba(23,14,19,.15) 0%, rgba(23,14,19,.55) 32%, rgba(23,14,19,.92) 58%, #170E13 100%); }
        .ps-conteudo { position: relative; z-index: 1; max-width: 560px; margin: 0 auto; padding: 0 18px 28px; display: flex; flex-direction: column; min-height: 100svh; }
        .ps-topo { padding: 30vh 4px 22px; text-align: center; opacity: 0; transform: translateY(12px); transition: opacity .7s ease, transform .7s ease; }
        .ps-topo.on { opacity: 1; transform: none; }
        .ps-selo { display: inline-block; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; padding: 7px 12px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--ps-cor) 55%, transparent); color: var(--ps-cor); background: rgba(23,14,19,.35); backdrop-filter: blur(6px); }
        .ps-marca { font-family: 'Marcellus', serif; font-size: clamp(52px, 15vw, 84px); line-height: .95; margin: 16px 0 4px; letter-spacing: .01em; color: #FFF8EE; text-shadow: 0 6px 30px rgba(0,0,0,.45); }
        .ps-logo { max-height: 92px; margin: 18px auto 6px; filter: drop-shadow(0 6px 22px rgba(0,0,0,.4)); }
        .ps-nome { font-size: 16px; color: #EADFD2; letter-spacing: .02em; }
        .ps-nome strong { color: var(--ps-cor); font-weight: 700; }
        .ps-sub { margin: 12px auto 0; max-width: 380px; font-size: 15px; line-height: 1.5; color: #D9CCBE; }
        .ps-pergunta { margin-top: 22px; font-family: 'Marcellus', serif; font-size: 19px; color: #FFF8EE; }
        .ps-lista { display: grid; grid-template-columns: 1fr; gap: 10px; }
        .ps-botao { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 16px; text-decoration: none; color: #FBF6EF;
          background: linear-gradient(135deg, rgba(255,255,255,.09), rgba(255,255,255,.03)); border: 1px solid rgba(255,255,255,.11); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          opacity: 0; transform: translateY(14px); transition: opacity .55s ease, transform .55s ease, border-color .2s, background .2s; }
        .ps-botao.on { opacity: 1; transform: none; }
        .ps-botao:hover, .ps-botao:active { border-color: color-mix(in srgb, var(--ps-cor) 70%, transparent); background: linear-gradient(135deg, color-mix(in srgb, var(--ps-cor) 22%, transparent), rgba(255,255,255,.04)); color: #FFF8EE; }
        .ps-icone { flex: 0 0 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 21px; background: color-mix(in srgb, var(--ps-cor) 16%, rgba(0,0,0,.25)); border: 1px solid color-mix(in srgb, var(--ps-cor) 35%, transparent); }
        .ps-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .ps-rotulo { font-size: 16px; font-weight: 700; line-height: 1.25; }
        .ps-subrotulo { font-size: 12.5px; color: #CDBFB1; line-height: 1.35; }
        .ps-seta { flex: 0 0 auto; color: var(--ps-cor); font-size: 26px; line-height: 1; display: flex; }
        .ps-rodape { margin-top: auto; padding-top: 28px; text-align: center; }
        .ps-redes { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; }
        .ps-redes a { width: 44px; height: 44px; border-radius: 999px; display: flex; align-items: center; justify-content: center; color: #FBF6EF; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.05); }
        .ps-legal { font-size: 11.5px; color: #9F8F82; letter-spacing: .04em; }
        @media (min-width: 900px) {
          .ps-conteudo { max-width: 920px; }
          .ps-topo { padding-top: 22vh; }
          .ps-lista { grid-template-columns: 1fr 1fr; gap: 12px; }
        }
        @media (prefers-reduced-motion: reduce) { .ps-topo, .ps-botao { transition: none; opacity: 1; transform: none; } }
      `}</style>
    </main>
  );
}
