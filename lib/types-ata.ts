export interface DadosOcr {
  secretario: string | null
  coordenador: string | null
  numero_reuniao: number | null
  data_reuniao: string | null
  tipo_reuniao: 'aberta' | 'fechada' | null
  literatura_lida: string | null
  observacoes: string | null
  presencas: Array<{ numero: number; nome: string }>
  visitantes: Array<{ numero: number; nome: string }>
  ingressos: Array<{
    nome_ingresso: string
    nome_padrinho: string
    como_conheceu: string | null
  }>
  trocas_ficha: Array<{
    nome_membro: string
    ficha: string
    nome_padrinho: string
  }>
  tesouraria: {
    saldo_anterior: number | null
    setima_tradicao: number | null
    vendas: number | null
    despesas: number | null
  }
  encargos: {
    rsg: string | null
    rsg_suplente: string | null
    secretario: string | null
    tesoureiro: string | null
    bem_estar: string | null
  }
  confianca_geral: number
}
