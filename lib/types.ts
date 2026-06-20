export type StatusGeral = 'ativo' | 'inativo'
export type TipoReuniao = 'aberta' | 'fechada'
export type FormatoReuniao = 'presencial' | 'online' | 'hibrida'
export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'
export type ResponsavelEvento = 'grupo' | 'subcomite' | 'area'
export type StatusEvento = 'publicado' | 'cancelado'
export type StatusEncargo = 'ativo' | 'vago' | 'inativo'
export type TipoUsuario = 'admin' | 'chave_grupo' | 'chave_subcomite'

export interface Grupo {
  id: string
  nome: string
  cidade: string
  bairro?: string
  endereco?: string
  status: StatusGeral
  observacoes?: string
  latitude?: number | null
  longitude?: number | null
  criado_em: string
  atualizado_em: string
}

export interface ReuniaoGrupo {
  id: string
  grupo_id: string
  dia_semana: DiaSemana
  horario: string
  tipo: TipoReuniao
  formato: FormatoReuniao
  endereco_link?: string
  status: StatusGeral
  observacoes?: string
}

export interface Subcomite {
  id: string
  nome: string
  sigla?: string
  descricao?: string
  status: StatusGeral
}

export interface ReuniaoSubcomite {
  id: string
  subcomite_id: string
  recorrente: boolean
  dia_semana?: DiaSemana
  data_especifica?: string
  horario: string
  formato: FormatoReuniao
  local_link?: string
  status: StatusGeral
  observacoes?: string
}

export interface TipoEncargo {
  id: string
  nome: string
  ativo: boolean
}

export interface Servidor {
  id: string
  nome_servico: string
  contato?: string
  contato_publico: boolean
  status: StatusGeral
}

export interface VinculoEncargo {
  id: string
  servidor_id: string
  tipo_encargo_id: string
  grupo_id?: string
  subcomite_id?: string
  mesa_area: boolean
  data_inicio: string
  data_fim?: string
  status: StatusEncargo
  servidores?: Servidor
  tipos_encargo?: TipoEncargo
}

export interface TipoEvento {
  id: string
  nome: string
  ativo: boolean
}

export interface Evento {
  id: string
  titulo: string
  data_evento: string
  horario?: string
  tipo_evento_id: string
  responsavel: ResponsavelEvento
  grupo_id?: string
  subcomite_id?: string
  local_link?: string
  descricao?: string
  link_externo?: string
  status: StatusEvento
  tipos_evento?: TipoEvento
  grupos?: Grupo
  subcomites?: Subcomite
}

export interface Usuario {
  id: string
  auth_user_id: string
  nome_servico: string
  tipo: TipoUsuario
  ativo: boolean
}

// Helpers de exibição
export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

export const FORMATO_LABEL: Record<FormatoReuniao, string> = {
  presencial: 'Presencial',
  online: 'Online',
  hibrida: 'Híbrida',
}

export const TIPO_REUNIAO_LABEL: Record<TipoReuniao, string> = {
  aberta: 'Aberta',
  fechada: 'Fechada',
}

export const RESPONSAVEL_LABEL: Record<ResponsavelEvento, string> = {
  grupo: 'Grupo',
  subcomite: 'Subcomitê',
  area: 'Área',
}
