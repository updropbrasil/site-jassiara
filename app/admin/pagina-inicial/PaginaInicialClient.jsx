'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase-browser';
import { LISTA_ICONES, IconeServico } from '../../icones';

// Editor da página inicial (pré-site), feito para o celular:
// dados da marca (foto, logo, cor, WhatsApp, Instagram) e os botões (texto, ordem, destino, mensagem).
const FILTROS = [
  { v: 'temporada', l: 'Locação por temporada' },
  { v: 'anual', l: 'Locação anual' },
  { v: 'planta', l: 'Imóvel na planta' },
  { v: 'pronto', l: 'Imóvel pronto' },
  { v: 'comercial', l: 'Ponto comercial' },
  { v: '', l: 'Todos os imóveis' },
];
const TIPOS = [
  { v: 'whatsapp', l: 'Abre o WhatsApp' },
  { v: 'site', l: 'Abre o site de imóveis' },
  { v: 'link', l: 'Abre um link' },
];
const CAMPOS = [
  { key: 'presite_titulo', label: 'Nome da marca (aparece grande)', exemplo: 'Facilite' },
  { key: 'presite_nome', label: 'Seu nome', exemplo: 'Jassiara' },
  { key: 'presite_subtitulo', label: 'Frase de apresentação', exemplo: 'Tudo o que você precisa em João Pessoa, num só lugar.', longo: true },
  { key: 'presite_whatsapp', label: 'WhatsApp dos botões', exemplo: '5583999999999', ajuda: 'Com 55 e DDD, só números.' },
  { key: 'presite_instagram', label: 'Instagram', exemplo: '@seuperfil' },
  { key: 'presite_creci', label: 'CRECI', exemplo: 'PB 0000' },
];

const caixa = { background: '#1F2218', border: '1px solid rgba(240,232,221,.15)', borderRadius: 10, padding: '12px 13px', color: 'var(--cream)', fontSize: 15, width: '100%' };
const rotuloSt = { fontSize: 13, fontWeight: 700, color: 'var(--cream-2)' };
const cartao = { background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 14, padding: 14 };

export default function PaginaInicialClient({ cfgInicial, botoesIniciais }) {
  const supabase = createClient();
  const [cfg, setCfg] = useState(() => ({ presite_foto_url: '', presite_retrato_url: '', presite_logo_url: '', presite_cor_primaria: '#5F6348', presite_cor_secundaria: '#B18A69', ...cfgInicial }));
  const [botoes, setBotoes] = useState(botoesIniciais);
  const [aberto, setAberto] = useState(null);
  const [msg, setMsg] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [enviando, setEnviando] = useState('');

  const setC = (k, v) => { setCfg(c => ({ ...c, [k]: v })); setMsg(''); };
  const setB = (id, k, v) => { setBotoes(bs => bs.map(b => (b.id === id ? { ...b, [k]: v } : b))); setMsg(''); };

  function mover(i, d) {
    const j = i + d;
    if (j < 0 || j >= botoes.length) return;
    const bs = [...botoes];
    [bs[i], bs[j]] = [bs[j], bs[i]];
    setBotoes(bs.map((b, k) => ({ ...b, ordem: k + 1 })));
    setMsg('');
  }

  function novoBotao() {
    const id = crypto.randomUUID();
    setBotoes(bs => [...bs, { id, _novo: true, ordem: bs.length + 1, rotulo: 'Novo serviço', subtitulo: '', icone: 'brilho', tipo: 'whatsapp', destino: '', mensagem: 'Olá! Vim pelo seu site e quero saber sobre…', ativo: true }]);
    setAberto(id);
  }

  async function apagar(b) {
    if (!b._novo) {
      const { error } = await supabase.from('presite_botoes').delete().eq('id', b.id);
      if (error) { setMsg('Não apagou: ' + error.message); return; }
    }
    setBotoes(bs => bs.filter(x => x.id !== b.id).map((x, k) => ({ ...x, ordem: k + 1 })));
    setAberto(null);
    setMsg('Botão apagado ✓');
  }

  async function enviarImagem(chave, arquivo) {
    if (!arquivo) return;
    if (arquivo.size > 8 * 1024 * 1024) { setMsg('A imagem passa de 8 MB. Escolha uma menor.'); return; }
    setEnviando(chave);
    const ext = (arquivo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const caminho = `${chave}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('presite').upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });
    setEnviando('');
    if (error) { setMsg('Não enviou a imagem: ' + error.message); return; }
    const { data } = supabase.storage.from('presite').getPublicUrl(caminho);
    setC(chave, data.publicUrl);
    setMsg('Imagem carregada. Toque em Salvar para publicar.');
  }

  async function salvar() {
    const w = String(cfg.presite_whatsapp || '').replace(/\D/g, '');
    if (w && !/^\d{12,13}$/.test(w)) { setMsg('O WhatsApp precisa ter 55 + DDD + número (ex.: 5583999999999).'); return; }
    for (const b of botoes) {
      if (!String(b.rotulo || '').trim()) { setMsg('Tem um botão sem nome.'); return; }
      if (b.tipo === 'link' && !/^https?:\/\//.test(b.destino || '')) { setMsg(`O botão "${b.rotulo}" precisa de um link começando com https://`); return; }
    }
    setSalvando(true);
    const linhasCfg = ['presite_titulo', 'presite_nome', 'presite_subtitulo', 'presite_whatsapp', 'presite_instagram', 'presite_creci', 'presite_foto_url', 'presite_retrato_url', 'presite_logo_url', 'presite_cor_primaria', 'presite_cor_secundaria']
      .map(k => ({ key: k, value: k === 'presite_whatsapp' ? w : String(cfg[k] || '').trim() }));
    const linhasBotoes = botoes.map((b, k) => ({
      id: b.id, ordem: k + 1, rotulo: b.rotulo.trim(), subtitulo: (b.subtitulo || '').trim() || null, icone: (b.icone || '').trim() || null,
      tipo: b.tipo, destino: b.tipo === 'whatsapp' ? null : (b.destino || '').trim() || null,
      mensagem: b.tipo === 'whatsapp' ? (b.mensagem || '').trim() || null : null, ativo: !!b.ativo,
    }));
    const r1 = await supabase.from('site_config').upsert(linhasCfg);
    const r2 = await supabase.from('presite_botoes').upsert(linhasBotoes);
    setSalvando(false);
    if (r1.error || r2.error) { setMsg('Não salvou: ' + (r1.error || r2.error).message); return; }
    setBotoes(bs => bs.map(b => ({ ...b, _novo: false })));
    setMsg('Salvo ✓ A página inicial atualiza em até 30 segundos.');
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)', paddingBottom: 96 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', padding: '14px 16px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin" style={{ display: 'flex', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 999, border: '1px solid rgba(240,232,221,.15)', color: 'var(--sand)' }}>‹</Link>
        <strong style={{ fontSize: 17, flex: 1 }}>Página inicial</strong>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700 }}>Ver página ↗</a>
      </header>

      <div style={{ maxWidth: 620, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <section style={cartao}>
          <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Sua marca</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[['presite_retrato_url', 'Sua foto (sem fundo)'], ['presite_logo_url', 'Logo']].map(([k, l]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
                <span style={rotuloSt}>{l}</span>
                <div style={{ aspectRatio: k === 'presite_retrato_url' ? '3/4' : '1/1', borderRadius: 12, border: '1px dashed rgba(240,232,221,.25)', background: cfg[k] ? `center/contain no-repeat url(${cfg[k]}), #F0E8DD` : '#1F2218', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', padding: 8 }}>
                  {enviando === k ? 'Enviando…' : cfg[k] ? '' : 'Toque para escolher'}
                </div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => enviarImagem(k, e.target.files?.[0])} />
                {cfg[k] && <button type="button" onClick={e => { e.preventDefault(); setC(k, ''); }} style={{ background: 'none', border: 0, color: '#c88a7a', fontSize: 12, padding: 0, textAlign: 'left' }}>Remover</button>}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CAMPOS.map(c => (
              <label key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={rotuloSt}>{c.label}</span>
                {c.longo
                  ? <textarea rows={2} value={cfg[c.key] || ''} onChange={e => setC(c.key, e.target.value)} placeholder={c.exemplo} style={{ ...caixa, resize: 'vertical' }} />
                  : <input value={cfg[c.key] || ''} onChange={e => setC(c.key, e.target.value)} placeholder={c.exemplo} style={caixa} inputMode={c.key === 'presite_whatsapp' ? 'tel' : undefined} autoCapitalize="off" />}
                {c.ajuda && <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{c.ajuda}</span>}
              </label>
            ))}
            {[['presite_cor_primaria', 'Cor principal (ícones)', '#5F6348'], ['presite_cor_secundaria', 'Cor de detalhe (setas e linhas)', '#B18A69']].map(([k, l, padrao]) => (
              <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(cfg[k] || '') ? cfg[k] : padrao} onChange={e => setC(k, e.target.value)} style={{ width: 52, height: 40, border: 0, background: 'none', padding: 0 }} />
                <span style={rotuloSt}>{l}</span>
              </label>
            ))}
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Botões ({botoes.length})</div>
            <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>Use ▲ ▼ para mudar a ordem</span>
          </div>
          {botoes.map((b, i) => {
            const abertoAqui = aberto === b.id;
            return (
              <div key={b.id} style={{ ...cartao, padding: 0, opacity: b.ativo ? 1 : 0.55 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir" style={{ background: 'none', border: 0, color: 'var(--sand)', fontSize: 13, padding: '2px 6px', opacity: i === 0 ? 0.25 : 1 }}>▲</button>
                    <button onClick={() => mover(i, 1)} disabled={i === botoes.length - 1} aria-label="Descer" style={{ background: 'none', border: 0, color: 'var(--sand)', fontSize: 13, padding: '2px 6px', opacity: i === botoes.length - 1 ? 0.25 : 1 }}>▼</button>
                  </div>
                  <span style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#5F6348', color: '#F0E8DD', flex: 'none' }}><IconeServico nome={b.icone} size={18} /></span>
                  <button onClick={() => setAberto(abertoAqui ? null : b.id)} style={{ flex: 1, minWidth: 0, background: 'none', border: 0, color: 'var(--cream)', textAlign: 'left', padding: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.rotulo}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{TIPOS.find(t => t.v === b.tipo)?.l}{typeof b.cliques === 'number' ? ` · ${b.cliques} cliques` : ''}</div>
                  </button>
                  <span style={{ color: 'var(--sand)', fontSize: 18 }}>{abertoAqui ? '−' : '+'}</span>
                </div>
                {abertoAqui && (
                  <div style={{ borderTop: '1px solid var(--line)', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={rotuloSt}>Nome do botão</span>
                      <input value={b.rotulo} onChange={e => setB(b.id, 'rotulo', e.target.value)} style={caixa} />
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={rotuloSt}>Ícone</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {LISTA_ICONES.map(([nome, legenda]) => (
                          <button key={nome} type="button" title={legenda} aria-label={legenda} onClick={() => setB(b.id, 'icone', nome)}
                            style={{ width: 42, height: 42, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: b.icone === nome ? '2px solid var(--accent)' : '1px solid rgba(240,232,221,.15)', background: b.icone === nome ? 'rgba(201,162,126,.15)' : '#1F2218', color: 'var(--cream)' }}>
                            <IconeServico nome={nome} size={19} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={rotuloSt}>Frase embaixo do nome</span>
                      <input value={b.subtitulo || ''} onChange={e => setB(b.id, 'subtitulo', e.target.value)} style={caixa} placeholder="opcional" />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={rotuloSt}>O que acontece ao tocar</span>
                      <select value={b.tipo} onChange={e => setB(b.id, 'tipo', e.target.value)} style={caixa}>
                        {TIPOS.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                      </select>
                    </label>
                    {b.tipo === 'whatsapp' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={rotuloSt}>Mensagem que já vai escrita</span>
                        <textarea rows={3} value={b.mensagem || ''} onChange={e => setB(b.id, 'mensagem', e.target.value)} style={{ ...caixa, resize: 'vertical' }} />
                      </label>
                    )}
                    {b.tipo === 'site' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={rotuloSt}>Abrir os imóveis de</span>
                        <select value={b.destino || ''} onChange={e => setB(b.id, 'destino', e.target.value)} style={caixa}>
                          {FILTROS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                        </select>
                      </label>
                    )}
                    {b.tipo === 'link' && (
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={rotuloSt}>Link</span>
                        <input value={b.destino || ''} onChange={e => setB(b.id, 'destino', e.target.value)} style={caixa} placeholder="https://" autoCapitalize="off" />
                      </label>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                        <input type="checkbox" checked={!!b.ativo} onChange={e => setB(b.id, 'ativo', e.target.checked)} style={{ width: 20, height: 20 }} />
                        Aparece na página
                      </label>
                      <button onClick={() => apagar(b)} style={{ background: 'none', border: '1px solid rgba(200,138,122,.4)', color: '#c88a7a', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>Apagar</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={novoBotao} style={{ padding: '13px', borderRadius: 12, border: '1px dashed rgba(201,162,126,.5)', background: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>+ Novo botão</button>
        </section>
      </div>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: 'linear-gradient(180deg, transparent, var(--bg) 35%)' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {msg && <div style={{ fontSize: 13, textAlign: 'center', color: msg.includes('✓') || msg.startsWith('Imagem') ? 'var(--green)' : '#c88a7a' }}>{msg}</div>}
          <button onClick={salvar} disabled={salvando} style={{ padding: '15px 20px', borderRadius: 12, background: 'var(--accent)', color: '#22251A', fontSize: 15, fontWeight: 700, border: 0, opacity: salvando ? 0.6 : 1 }}>
            {salvando ? 'Salvando…' : 'Salvar e publicar'}
          </button>
        </div>
      </div>
    </main>
  );
}
