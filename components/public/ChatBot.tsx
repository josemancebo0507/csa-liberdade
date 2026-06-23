'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  id: string
}

const WELCOME: Message = {
  role: 'assistant',
  content: 'Olá! Sou o assistente do CSA Liberdade. Posso te ajudar a encontrar reuniões, eventos, informações sobre grupos e subcomitês da área. Como posso ajudar?',
  id: 'welcome',
}

const SUGESTOES = [
  'Tem reunião hoje?',
  'Quais grupos ficam em Campinas?',
  'Quem é o coordenador da área?',
  'Quais eventos estão chegando?',
]

export default function ChatBot() {
  const [aberto,     setAberto]     = useState(false)
  const [messages,   setMessages]   = useState<Message[]>([WELCOME])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [hasUnread,  setHasUnread]  = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const abertoRef = useRef(false)

  useEffect(() => { abertoRef.current = aberto }, [aberto])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (aberto) {
      setHasUnread(false)
      setTimeout(() => inputRef.current?.focus(), 220)
    }
  }, [aberto])

  async function handleSend(messageText?: string) {
    const text = (messageText ?? input).trim()
    if (!text || loading) return

    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(({ role, content }) => ({ role, content }))

    setMessages(prev => [...prev, { role: 'user', content: text, id: `u-${Date.now()}` }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: text, history }),
      })

      // JSON significa erro do servidor (4xx / 5xx); text/plain é o stream normal
      const contentType = response.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const err = await response.json()
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: err.error ?? 'Ocorreu um erro. Tente novamente.', id: `e-${Date.now()}` },
        ])
        return
      }

      const assistantId = `a-${Date.now()}`
      setMessages(prev => [...prev, { role: 'assistant', content: '', id: assistantId }])

      const reader  = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          const last    = updated[updated.length - 1]
          updated[updated.length - 1] = { ...last, content: last.content + chunk }
          return updated
        })
      }

      if (!abertoRef.current) setHasUnread(true)
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role:    'assistant',
          content: 'Desculpe, não consegui processar sua pergunta agora. Tente novamente em instantes.',
          id:      `e-${Date.now()}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const mostrarSugestoes = messages.length === 1

  return (
    <>
      {/* ── Janela de chat ─────────────────────────────────── */}
      <div
        aria-hidden={!aberto}
        style={{
          position:        'fixed',
          bottom:          88,
          right:           24,
          zIndex:          50,
          width:           'min(360px, calc(100vw - 32px))',
          height:          520,
          maxHeight:       'calc(100vh - 96px)',
          background:      'var(--csa-surface)',
          border:          '1px solid var(--csa-border)',
          borderRadius:    20,
          boxShadow:       '0 8px 40px rgba(0,0,0,0.15)',
          display:         'flex',
          flexDirection:   'column',
          overflow:        'hidden',
          opacity:         aberto ? 1 : 0,
          transform:       aberto ? 'scale(1)' : 'scale(0.95)',
          transformOrigin: 'bottom right',
          transition:      'opacity 200ms, transform 200ms',
          pointerEvents:   aberto ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 16px',
          height:         56,
          background:     'var(--csa-accent)',
          borderRadius:   '20px 20px 0 0',
          flexShrink:     0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={20} color="white" />
            <span style={{ color: 'white', fontWeight: 500, fontSize: 14 }}>
              Assistente CSA Liberdade
            </span>
          </div>
          <button
            onClick={() => setAberto(false)}
            aria-label="Fechar chat"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <X size={20} color="white" />
          </button>
        </div>

        {/* Área de mensagens */}
        <div style={{
          flex:          1,
          overflowY:     'auto',
          padding:       16,
          display:       'flex',
          flexDirection: 'column',
          gap:           12,
        }}>
          {messages.map((msg, idx) => {
            const isUser     = msg.role === 'user'
            const isLast     = idx === messages.length - 1
            const isEmpty    = isLast && loading && !isUser && msg.content === ''
            const isStreaming = isLast && loading && !isUser && msg.content !== ''

            return (
              <div
                key={msg.id}
                style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}
              >
                {isEmpty ? (
                  /* Três pontos enquanto o primeiro token não chega */
                  <div style={{
                    background:   'var(--csa-tint)',
                    borderRadius: '4px 16px 16px 16px',
                    padding:      '12px 16px',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          4,
                  }}>
                    <span className="chat-dot" />
                    <span className="chat-dot" />
                    <span className="chat-dot" />
                  </div>
                ) : (
                  <div
                    className={isStreaming ? 'chat-cursor' : ''}
                    style={{
                      maxWidth:     '85%',
                      padding:      '10px 14px',
                      borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                      background:   isUser ? 'var(--csa-accent)' : 'var(--csa-tint)',
                      color:        isUser ? 'white' : 'var(--csa-text-1)',
                      fontSize:     14,
                      lineHeight:   1.5,
                      whiteSpace:   'pre-wrap',
                      wordBreak:    'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                )}
              </div>
            )
          })}

          {/* Indicador de espera antes do primeiro token (last message is still from user) */}
          {loading && messages[messages.length - 1]?.role === 'user' && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background:   'var(--csa-tint)',
                borderRadius: '4px 16px 16px 16px',
                padding:      '12px 16px',
                display:      'flex',
                alignItems:   'center',
                gap:          4,
              }}>
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-dot" />
              </div>
            </div>
          )}

          {/* Chips de sugestão */}
          {mostrarSugestoes && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {SUGESTOES.map(s => (
                <SugestaoChip key={s} label={s} onSelect={() => handleSend(s)} />
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:         8,
          padding:     '8px 12px',
          borderTop:   '1px solid var(--csa-border)',
          flexShrink:  0,
          height:      64,
          boxSizing:   'border-box',
        }}>
          <input
            ref={inputRef}
            className="form-input"
            style={{ flex: 1, border: 'none', boxShadow: 'none', padding: '8px 4px', background: 'transparent' }}
            placeholder="Digite sua pergunta…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Enviar"
            style={{
              background:  'none',
              border:      'none',
              cursor:      !input.trim() || loading ? 'not-allowed' : 'pointer',
              opacity:     !input.trim() || loading ? 0.35 : 1,
              color:       'var(--csa-accent)',
              display:     'flex',
              padding:     4,
              transition:  'opacity 0.15s',
              flexShrink:  0,
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* ── Botão flutuante ─────────────────────────────────── */}
      <button
        onClick={() => setAberto(v => !v)}
        aria-label={aberto ? 'Fechar chat' : 'Abrir chat'}
        style={{
          position:       'fixed',
          bottom:         24,
          right:          24,
          zIndex:         50,
          width:          56,
          height:         56,
          borderRadius:   '50%',
          background:     'var(--csa-accent)',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 4px 20px rgba(63,90,166,0.4)',
          transition:     'transform 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <MessageCircle size={24} color="white" />
        {hasUnread && (
          <span style={{
            position:       'absolute',
            top:            0,
            right:          0,
            width:          18,
            height:         18,
            borderRadius:   '50%',
            background:     '#ef4444',
            border:         '2px solid var(--csa-bg)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       10,
            fontWeight:     700,
            color:          'white',
          }}>
            !
          </span>
        )}
      </button>
    </>
  )
}

// Extracted to a separate component so hover state stays local
function SugestaoChip({ label, onSelect }: { label: string; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize:     12,
        padding:      '5px 12px',
        borderRadius: 9999,
        border:       '1px solid var(--csa-border)',
        background:   hovered ? 'var(--csa-accent)' : 'var(--csa-tint)',
        color:        hovered ? 'white' : 'var(--csa-accent)',
        cursor:       'pointer',
        transition:   'background 0.15s, color 0.15s',
        fontFamily:   'inherit',
      }}
    >
      {label}
    </button>
  )
}
