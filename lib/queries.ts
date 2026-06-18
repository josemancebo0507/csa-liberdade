import { createClient, createAdminClient } from './supabase/server'
import type { Grupo, Subcomite, Evento, VinculoEncargo } from './types'

// ─── GRUPOS ─────────────────────────────────────────────────────────────────

export async function getGrupos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos')
    .select(`
      *,
      reunioes_grupo(*),
      vinculos_encargo(
        *,
        servidores(*),
        tipos_encargo(*)
      )
    `)
    .eq('status', 'ativo')
    .neq('vinculos_encargo.status', 'inativo')
    .order('nome')

  if (error) throw error
  return data
}

export async function getGrupoById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos')
    .select(`
      *,
      reunioes_grupo(*),
      vinculos_encargo(
        *,
        servidores(*),
        tipos_encargo(*)
      ),
      eventos(
        *,
        tipos_evento(*)
      )
    `)
    .eq('id', id)
    .eq('status', 'ativo')
    .single()

  if (error) throw error
  return data
}

// ─── SUBCOMITÊS ─────────────────────────────────────────────────────────────

export async function getSubcomites() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('subcomites')
    .select(`
      *,
      reunioes_subcomite(*),
      vinculos_encargo(
        *,
        servidores(*),
        tipos_encargo(*)
      )
    `)
    .eq('status', 'ativo')
    .order('nome')

  if (error) throw error
  return data
}

// ─── MESA DA ÁREA ────────────────────────────────────────────────────────────

export async function getMesaArea() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vinculos_encargo')
    .select(`
      *,
      servidores(*),
      tipos_encargo(*)
    `)
    .eq('mesa_area', true)
    .neq('status', 'inativo')
    .order('criado_em')

  if (error) throw error
  return data
}

// ─── EVENTOS ─────────────────────────────────────────────────────────────────

export async function getEventos(filtros?: {
  grupo_id?: string
  subcomite_id?: string
  responsavel?: string
  tipo_evento_id?: string
}) {
  const supabase = await createClient()
  let query = supabase
    .from('eventos')
    .select(`
      *,
      tipos_evento(*),
      grupos(nome, cidade),
      subcomites(nome, sigla)
    `)
    .eq('status', 'publicado')
    .gte('data_evento', new Date().toISOString().split('T')[0])
    .order('data_evento')

  if (filtros?.grupo_id)      query = query.eq('grupo_id', filtros.grupo_id)
  if (filtros?.subcomite_id)  query = query.eq('subcomite_id', filtros.subcomite_id)
  if (filtros?.responsavel)   query = query.eq('responsavel', filtros.responsavel)
  if (filtros?.tipo_evento_id) query = query.eq('tipo_evento_id', filtros.tipo_evento_id)

  const { data, error } = await query
  if (error) throw error
  return data
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export async function getAdminGrupos() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('grupos')
    .select('*')
    .order('nome')
  if (error) throw error
  return data
}

export async function getAdminSubcomites() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('subcomites')
    .select('*')
    .order('nome')
  if (error) throw error
  return data
}

export async function getAdminEventos() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('eventos')
    .select(`*, tipos_evento(*), grupos(nome), subcomites(nome)`)
    .order('data_evento', { ascending: false })
  if (error) throw error
  return data
}

export async function getTiposEncargo() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_encargo')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function getTiposEvento() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tipos_evento')
    .select('*')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data
}

export async function getUsuarios() {
  const supabase = await createAdminClient()
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('nome_servico')
  if (error) throw error
  return data
}
