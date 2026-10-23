/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'lqsklpuydvaowygxpwzc.supabase.co' }, // banco da Jassiara
      { protocol: 'https', hostname: 'cteahzplamqnjkuxnkva.supabase.co' }  // imóveis em parceria vindos do site Jason Dias
    ]
  }
};
module.exports = nextConfig;
