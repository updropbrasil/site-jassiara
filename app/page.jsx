import { createPublicClient } from '../lib/supabase-public';
import PreSiteClient from './PreSiteClient';

// Página inicial (pré-site Jassiara Vasconcelos): um botão por serviço. Tudo vem do banco
// (tabela presite_botoes e chaves presite_* em site_config) e é editado em Admin → Página inicial.
export const revalidate = 30;

export async function generateMetadata() {
  const cfg = await getConfig();
  const titulo = `${cfg.presite_titulo || 'Jassiara Vasconcelos'} · Facilitadora de negócios`;
  return {
    title: { absolute: titulo },
    description: cfg.presite_subtitulo || 'Conectando você às melhores oportunidades em João Pessoa.',
    openGraph: { title: titulo, description: cfg.presite_subtitulo || '', images: cfg.presite_foto_url ? [cfg.presite_foto_url] : [] },
  };
}

async function getConfig() {
  const supabase = createPublicClient();
  const { data } = await supabase.from('site_config').select('key, value').like('key', 'presite_%');
  const cfg = {};
  (data || []).forEach(r => { cfg[r.key] = (r.value || '').trim(); });
  return cfg;
}

async function getBotoes() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('presite_botoes')
    .select('id, rotulo, subtitulo, icone, tipo, destino, mensagem')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  if (error) { console.error(error); return []; }
  return data || [];
}

export default async function PreSitePage() {
  const [cfg, botoes] = await Promise.all([getConfig(), getBotoes()]);
  return <PreSiteClient cfg={cfg} botoes={botoes} />;
}
