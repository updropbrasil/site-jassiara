// Permite "Adicionar à tela de início" no celular: abre direto no painel, como um app.
export default function manifest() {
  return {
    name: 'Jassiara Vasconcelos · Painel',
    short_name: 'Jassiara',
    description: 'Painel da página inicial e dos imóveis',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F0E8DD',
    theme_color: '#5F6348',
    lang: 'pt-BR',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
