import { createPublicClient as createClient, whatsappDoSite } from '../../lib/supabase-public';
import PortalClient from '../PortalClient';
import { imovelPublico } from '../../lib/publico';

export const revalidate = 60; // ISR: revalida a cada 60s

async function getImoveis() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('imoveis')
    .select('*, imovel_fotos(url, thumb_url, ordem)')
    .eq('status', 'ativo')
    .order('destaque', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(imovelPublico); // sem endereço com número, contato interno e parceiro
}

async function getHero() {
  const supabase = createClient();
  const { data: cfg } = await supabase
    .from('site_config')
    .select('key, value')
    .in('key', ['hero_video', 'hero_video_file', 'presite_imoveis_foto']);
  const map = {};
  (cfg || []).forEach(r => { map[r.key] = r.value; });
  const heroVideoFile = map.hero_video_file || '';
  // foto dela no topo (painel → Página inicial). Sem a chave: foto padrão; chave vazia: sem foto.
  const heroFoto = 'presite_imoveis_foto' in map ? (map.presite_imoveis_foto || '') : '/brand/retrato-sentada.webp';
  // diferente do site Jason Dias: só usa vídeo no topo se ela escolher um (não pega o vídeo de um imóvel)
  return { heroVideo: map.hero_video || '', heroVideoFile, heroFoto };
}

async function getCreci() {
  const { data } = await createClient().from('site_config').select('value').eq('key', 'presite_creci').maybeSingle();
  return (data?.value || '').trim();
}

export default async function HomePage() {
  const [imoveis, hero, whats, creci] = await Promise.all([getImoveis(), getHero(), whatsappDoSite(createClient()), getCreci()]);
  return <PortalClient imoveis={imoveis} heroVideo={hero.heroVideo} heroVideoFile={hero.heroVideoFile} heroFoto={hero.heroFoto} whats={whats} creci={creci} />;
}
