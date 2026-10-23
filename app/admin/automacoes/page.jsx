import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase-server';
import AutomacoesClient from './AutomacoesClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Automações', robots: { index: false } };

// Automações por gatilho no Instagram (comentário e direct) e no WhatsApp.
// Regra de ouro: só responde quem acionar um gatilho; conversa normal fica com a Jassiara.
export default async function AutomacoesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const [{ data: regras }, { data: eventos }, { data: cfgRows }, { data: imoveis }] = await Promise.all([
    supabase.from('automacoes').select('*').order('ordem', { ascending: true }).order('created_at', { ascending: true }),
    supabase.from('automacao_eventos').select('*').order('criado_em', { ascending: false }).limit(80),
    supabase.from('site_config').select('key, value').or('key.like.auto_%,key.like.secretaria_%,key.eq.presite_whatsapp,key.eq.site_whatsapp'),
    supabase.from('imoveis').select('codigo, titulo, slug, bairro, finalidade').eq('status', 'ativo').order('created_at', { ascending: false }).limit(300),
  ]);
  const cfg = {};
  (cfgRows || []).forEach(r => { cfg[r.key] = r.value || ''; });
  return <AutomacoesClient regrasIniciais={regras || []} eventosIniciais={eventos || []} cfgInicial={cfg} imoveis={imoveis || []} />;
}
