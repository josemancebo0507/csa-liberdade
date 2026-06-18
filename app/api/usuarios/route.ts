import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente admin com service_role — pode criar usuários no Auth
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { nome_servico, email, senha, tipo, grupo_id, subcomite_id } = await req.json()

    if (!nome_servico || !email || !senha || !tipo) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando.' }, { status: 400 })
    }

    // 1. Cria o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const authUserId = authData.user.id

    // 2. Cria o perfil na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({ auth_user_id: authUserId, nome_servico, tipo, ativo: true })
      .select()
      .single()

    if (usuarioError) {
      // Rollback: remove o usuário do Auth se o perfil falhou
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return NextResponse.json({ error: usuarioError.message }, { status: 500 })
    }

    // 3. Vincula ao grupo ou subcomitê se necessário
    if (tipo === 'chave_grupo' && grupo_id) {
      await supabaseAdmin.from('usuario_grupo').insert({ usuario_id: usuario.id, grupo_id })
    }

    if (tipo === 'chave_subcomite' && subcomite_id) {
      await supabaseAdmin.from('usuario_subcomite').insert({ usuario_id: usuario.id, subcomite_id })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
