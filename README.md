# CSA Liberdade — Portal de Serviços

Portal de serviços do Comitê de Serviço de Área Liberdade — Narcóticos Anônimos.

## Stack
- **Frontend/Backend:** Next.js 15 (App Router)
- **Banco de dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth
- **Deploy:** Vercel

## Configuração inicial

### 1. Banco de dados
No painel do Supabase, vá em **SQL Editor** e execute o arquivo `supabase/schema.sql`.

### 2. Criar primeiro administrador
Após rodar o schema, no Supabase vá em **Authentication → Users → Add user** e crie o primeiro usuário admin.

Em seguida, no **SQL Editor**, rode:
```sql
INSERT INTO usuarios (auth_user_id, nome_servico, tipo)
VALUES ('<UUID do usuário criado>', 'Seu Nome de Serviço', 'admin');
```

### 3. Variáveis de ambiente
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

> Nenhuma chave de API de mapas é necessária. O mapa usa OpenStreetMap (gratuito) e a geocodificação usa Nominatim (gratuita).

### 4. Rodar localmente
```bash
npm install
npm run dev
```

## Deploy na Vercel
1. Suba para um repositório GitHub
2. Importe na Vercel
3. Adicione as 3 variáveis de ambiente
4. Deploy

## Mapa de grupos (`/mapa`)

O mapa usa **Leaflet + react-leaflet** com tiles do **OpenStreetMap** (licença ODbL).
Grupos precisam de coordenadas (`latitude`/`longitude`) na tabela `grupos` para aparecer no mapa.

### Geocodificação em lote

Para geocodificar todos os grupos que ainda não têm coordenadas:

```bash
npx tsx scripts/geocodificar-grupos.ts
```

O script usa a API **Nominatim** (OSM, gratuita, sem chave). O delay de 1100ms entre
chamadas respeita o limite de 1 req/s da API.

Novos grupos são geocodificados automaticamente ao salvar no painel admin.

## Chatbot IA

O portal público inclui um chatbot flutuante que responde perguntas dos visitantes com base nos dados reais do banco.

**Tecnologia:** [Groq API](https://console.groq.com) com modelo `llama3-70b-8192` (gratuito no plano Free).

**Variável de ambiente necessária:**
```
GROQ_API_KEY=gsk_...
```
Adicionar em `.env.local` para desenvolvimento e nas variáveis de ambiente da Vercel para produção.

**Como criar a chave:**
1. Acesse [console.groq.com](https://console.groq.com)
2. Crie uma conta gratuita
3. Vá em **API Keys → Create API Key**
4. Copie a chave e adicione como `GROQ_API_KEY`

**Privacidade e segurança:**
- O chatbot é **somente leitura** — nunca modifica dados
- Contatos de servidores com `contato_publico = false` são removidos dos dados antes de serem enviados ao modelo
- A chave Groq é usada apenas no servidor (Route Handler), nunca exposta ao navegador

## Páginas públicas
| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/grupos` | Lista de grupos |
| `/subcomites` | Subcomitês |
| `/mesa` | Mesa da área |
| `/eventos` | Próximos eventos |

Área administrativa em `/login`.
