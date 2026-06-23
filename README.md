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

**Tecnologia:** [Google AI Studio](https://aistudio.google.com) com modelo `gemini-1.5-flash` (plano gratuito: ~1 500 requisições/dia e ~1 M tokens/dia).

**Variável de ambiente necessária:**
```
GOOGLE_AI_API_KEY=AIza...
```
Adicionar em `.env.local` para desenvolvimento e nas variáveis de ambiente da Vercel para produção.

**Como criar a chave:**
1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Faça login com sua conta Google
3. Clique em **Get API key → Create API key**
4. Copie a chave e adicione como `GOOGLE_AI_API_KEY`

**Cache de contexto:**
Os dados do banco (grupos, subcomitês, mesa, eventos) são buscados uma vez e mantidos em memória por 5 minutos. Perguntas em sequência reaproveitam o mesmo contexto, reduzindo consumo de tokens e latência.

**Privacidade e segurança:**
- O chatbot é **somente leitura** — nunca modifica dados
- Contatos de servidores com `contato_publico = false` são removidos antes de enviar ao modelo
- A chave da API é usada apenas no servidor (Route Handler), nunca exposta ao navegador

## Páginas públicas
| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/grupos` | Lista de grupos |
| `/subcomites` | Subcomitês |
| `/mesa` | Mesa da área |
| `/eventos` | Próximos eventos |

Área administrativa em `/login`.
