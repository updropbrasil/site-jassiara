'use client';
import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';

// Tour guiado (passo a passo com destaque na tela), reaproveitável em qualquer página.
// Uso: <TourGuiado aberto={x} onFechar={...} passos={[{ alvo: '[data-tour="geral"]', titulo, texto }]} />
// alvo vazio ou não encontrado = cartão no meio da tela.
// Hook useTourPrimeiraVez(chave): abre sozinho na primeira visita (guarda no navegador).

export function useTourPrimeiraVez(chave) {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(chave)) setAberto(true); } catch (e) { /* sem storage: não abre sozinho */ }
  }, [chave]);
  const fechar = useCallback(() => { setAberto(false); try { localStorage.setItem(chave, '1'); } catch (e) {} }, [chave]);
  return [aberto, setAberto, fechar];
}

export default function TourGuiado({ aberto, onFechar, passos }) {
  const [i, setI] = useState(0);
  const [ret, setRet] = useState(null);
  const [tela, setTela] = useState({ w: 1024, h: 768 });
  const cartaoRef = useRef(null);
  const [altCartao, setAltCartao] = useState(260);
  const p = passos[i] || {};

  useEffect(() => { if (aberto) setI(0); }, [aberto]);

  const medir = useCallback(() => {
    setTela({ w: window.innerWidth, h: window.innerHeight });
    const el = p.alvo ? document.querySelector(p.alvo) : null;
    if (!el) { setRet(null); return; }
    const r = el.getBoundingClientRect();
    setRet({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [p.alvo]);

  useLayoutEffect(() => {
    if (!aberto) return;
    const el = p.alvo ? document.querySelector(p.alvo) : null;
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    medir();
    const t1 = setTimeout(medir, 350), t2 = setTimeout(medir, 700);
    window.addEventListener('resize', medir); window.addEventListener('scroll', medir, true);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', medir); window.removeEventListener('scroll', medir, true); };
  }, [aberto, i, medir, p.alvo]);

  useLayoutEffect(() => { if (aberto && cartaoRef.current) setAltCartao(cartaoRef.current.offsetHeight); }, [aberto, i, tela.w]);

  useEffect(() => {
    if (!aberto) return;
    const k = (e) => { if (e.key === 'Escape') onFechar(); if (e.key === 'ArrowRight') setI(n => Math.min(n + 1, passos.length - 1)); if (e.key === 'ArrowLeft') setI(n => Math.max(n - 1, 0)); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [aberto, onFechar, passos.length]);

  if (!aberto) return null;
  const ultimo = i === passos.length - 1;
  const celular = tela.w < 640;
  const folga = 8;
  // cartão: no celular fica embaixo (ou em cima, se o destaque estiver embaixo); no computador ao lado do destaque
  let cartaoPos;
  const h = altCartao + 16;
  if (!ret) cartaoPos = celular ? { left: 12, right: 12, top: '50%', transform: 'translateY(-50%)' } : { left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };
  else if (celular) cartaoPos = (ret.y + ret.h / 2 > tela.h * 0.55) ? { left: 12, right: 12, top: 12 } : { left: 12, right: 12, bottom: 12 };
  else {
    const left = Math.min(Math.max(ret.x, 16), tela.w - 396);
    if (tela.h - (ret.y + ret.h + folga) >= h) cartaoPos = { left, top: ret.y + ret.h + folga + 10 };            // embaixo
    else if (ret.y - folga >= h) cartaoPos = { left, top: ret.y - folga - 10 - altCartao };                        // em cima
    else if (tela.w - (ret.x + ret.w + folga) >= 400) cartaoPos = { left: ret.x + ret.w + folga + 14, top: Math.min(Math.max(16, ret.y), tela.h - h) }; // à direita
    else if (ret.x - folga >= 400) cartaoPos = { left: ret.x - folga - 394, top: Math.min(Math.max(16, ret.y), tela.h - h) };                           // à esquerda
    else cartaoPos = { right: 16, bottom: 16 };
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={p.titulo} style={{ position: 'fixed', inset: 0, zIndex: 1000 }}>
      {/* fundo escuro com "buraco" no item destacado */}
      {ret ? (
        <div style={{ position: 'fixed', left: ret.x - folga, top: ret.y - folga, width: ret.w + folga * 2, height: ret.h + folga * 2, borderRadius: 16, boxShadow: '0 0 0 9999px rgba(10,11,7,.72)', border: '2px solid #C9A27E', transition: 'all .3s ease', pointerEvents: 'none' }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,11,7,.72)' }} />
      )}
      <div style={{ position: 'fixed', inset: 0 }} onClick={() => {}} />
      <div ref={cartaoRef} style={{ position: 'fixed', ...cartaoPos, width: celular ? 'auto' : 380, maxWidth: 'calc(100vw - 24px)', background: '#F3EDE3', color: '#262820', borderRadius: 18, padding: '18px 18px 14px', boxShadow: '0 24px 60px rgba(0,0,0,.45)', transition: 'top .3s ease, bottom .3s ease, left .3s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.12em', color: '#9C7656' }}>PASSO {i + 1} DE {passos.length}</span>
          <button onClick={onFechar} style={{ background: 'none', border: 0, color: '#6E6A59', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 4 }}>Pular</button>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: '#E1D8C8', marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ width: `${((i + 1) / passos.length) * 100}%`, height: '100%', background: '#5F6348', transition: 'width .3s ease' }} />
        </div>
        <strong style={{ display: 'block', fontSize: 17, lineHeight: 1.3, marginBottom: 6 }}>{p.titulo}</strong>
        <div style={{ fontSize: 14.5, lineHeight: 1.55, color: '#3E4130', whiteSpace: 'pre-line' }}>{p.texto}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {i > 0 && <button onClick={() => setI(i - 1)} style={{ flex: '0 0 auto', padding: '12px 16px', borderRadius: 12, border: '1px solid #CFC6B5', background: 'transparent', color: '#3E4130', fontWeight: 700, cursor: 'pointer' }}>Voltar</button>}
          <button onClick={() => (ultimo ? onFechar() : setI(i + 1))} style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 0, background: '#5F6348', color: '#F8F3EB', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>{ultimo ? 'Entendi, vamos lá' : 'Próximo'}</button>
        </div>
      </div>
    </div>
  );
}
