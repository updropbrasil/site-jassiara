-- Botões da página inicial, na ordem definida pelo Vitor em 22/10/2026 (todos no mesmo nível)
insert into public.presite_botoes (ordem, rotulo, subtitulo, icone, tipo, destino, mensagem) values
 (1,  'Locação por temporada', 'Dias ou semanas, mobiliado e pronto', '🌴', 'site', 'temporada', null),
 (2,  'Locação anual', 'Seu próximo lar em João Pessoa', '🔑', 'site', 'anual', null),
 (3,  'Imóvel na planta', 'Lançamentos com condições de pré-venda', '🏗️', 'site', 'planta', null),
 (4,  'Imóvel pronto', 'Para morar ou investir agora', '🏡', 'site', 'pronto', null),
 (5,  'Ponto comercial', 'Salas, lojas e pontos para o seu negócio', '🏪', 'site', 'comercial', null),
 (6,  'Prestadores de serviço', 'Profissionais de confiança indicados por mim', '🛠️', 'whatsapp', null, 'Olá, Jassiara! Vim pelo seu site e preciso de um prestador de serviço.'),
 (7,  'Uber Black', 'Transporte executivo', '🚘', 'whatsapp', null, 'Olá, Jassiara! Vim pelo seu site e quero um Uber Black.'),
 (8,  'Locação de carro', 'Carro para a sua estadia', '🚗', 'whatsapp', null, 'Olá, Jassiara! Vim pelo seu site e quero alugar um carro.'),
 (9,  'Passeios', 'O melhor da Paraíba com quem conhece', '⛵', 'whatsapp', null, 'Olá, Jassiara! Vim pelo seu site e quero saber dos passeios.'),
 (10, 'Quero montar meu negócio em João Pessoa', 'Do ponto ao primeiro cliente', '🚀', 'whatsapp', null, 'Olá, Jassiara! Vim pelo seu site e quero montar meu negócio em João Pessoa.'),
 (11, 'Sou proprietário', 'Anuncie ou administre seu imóvel com a Facilite', '🤝', 'whatsapp', null, 'Olá, Jassiara! Vim pelo seu site. Sou proprietário e quero falar sobre o meu imóvel.');

insert into public.site_config (key, value) values
 ('presite_marca', 'Facilite'),
 ('presite_nome', 'Jassiara'),
 ('presite_titulo', 'Facilite'),
 ('presite_subtitulo', 'Tudo o que você precisa em João Pessoa, num só lugar.'),
 ('presite_foto_url', ''),
 ('presite_logo_url', ''),
 ('presite_cor_primaria', ''),
 ('presite_whatsapp', ''),
 ('presite_instagram', ''),
 ('presite_creci', ''),
 ('site_whatsapp', ''),
 ('codigo_prefixo_venda', 'JSV'),
 ('codigo_prefixo_aluguel', 'JSA')
on conflict (key) do nothing;
