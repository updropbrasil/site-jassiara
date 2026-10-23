import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase-server';
import PaginaInicialClient from './PaginaInicialClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Página inicial', robots: { index: false } };

export default async function PaginaInicialPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const [{ data: cfgRows }, { data: botoes }] = await Promise.all([
    supabase.from('site_config').select('key, value').like('key', 'presite_%'),
    supabase.from('presite_botoes').select('*').order('ordem', { ascending: true }),
  ]);
  const cfg = {};
  (cfgRows || []).forEach(r => { cfg[r.key] = r.value || ''; });
  return <PaginaInicialClient cfgInicial={cfg} botoesIniciais={botoes || []} />;
}
