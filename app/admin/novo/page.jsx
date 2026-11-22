import { redirect } from 'next/navigation';
import { createClient } from '../../../lib/supabase-server';
import CadastroClient from './CadastroClient';

export const dynamic = 'force-dynamic';

export default async function NovoPage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: parceiros } = await supabase.from('parceiros').select('*').order('nome');

  let imovel = null, fotos = [];
  // Temporada: dados extras do imóvel no sistema de temporada (mesmo banco, tabelas temporada_*).
  let temporada = null, acesso = null;
  const { data: proprietarios } = await supabase.from('temporada_proprietarios').select('id, nome').order('nome');
  if (searchParams?.id) {
    const { data } = await supabase.from('imoveis').select('*').eq('id', searchParams.id).maybeSingle();
    imovel = data;
    if (data) {
      const { data: f } = await supabase.from('imovel_fotos').select('*').eq('imovel_id', data.id).order('ordem');
      fotos = f || [];
      const [t, a] = await Promise.all([
        supabase.from('temporada_imoveis').select('*').eq('imovel_id', data.id).maybeSingle(),
        supabase.from('temporada_acessos').select('*').eq('imovel_id', data.id).maybeSingle(),
      ]);
      temporada = t.data || null;
      acesso = a.data || null;
    }
  }

  return <CadastroClient parceiros={parceiros || []} imovel={imovel} fotosIniciais={fotos}
    temporada={temporada} acesso={acesso} proprietarios={proprietarios || []} />;
}
