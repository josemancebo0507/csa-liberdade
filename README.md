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

## Páginas públicas
| Rota | Descrição |
|------|-----------|
| `/` | Página inicial |
| `/grupos` | Lista de grupos |
| `/subcomites` | Subcomitês |
| `/mesa` | Mesa da área |
| `/eventos` | Próximos eventos |

Área administrativa em `/login`.
