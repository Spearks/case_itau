import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import logo from './assets/logo.svg'

const pageClass = 'min-h-screen bg-gray-100 text-gray-900'
const headerClass = 'bg-[#EC7000] px-6 py-4 text-white font-bold text-lg'
const containerClass = 'mx-auto max-w-3xl px-4 py-10'
const cardClass = 'rounded-2xl bg-white p-8 shadow-md'
const sectionClass = 'mb-6 rounded-xl border border-gray-200 bg-gray-50 p-5'
const labelClass = 'flex items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-[#EC7000]'
const buttonBaseClass = 'w-full rounded-full py-4 font-bold text-white transition'

const buildChecklistItems = (data) =>
  data.checklist.map((item) => ({
    id: item.toLowerCase().replace(/\s+/g, '-'),
    title: item,
    description:
      item === 'Links testados'
        ? 'Todos os destinos foram validados e abrem corretamente.'
        : item === 'Assunto aprovado'
          ? 'Mensagem revisada e aprovada pela área responsável.'
          : 'Base e segmentação conferidas antes do envio.',
  }))

function App() {
  const [dispatchData, setDispatchData] = useState(null)
  const [loadState, setLoadState] = useState('loading')
  const [checkedItems, setCheckedItems] = useState({
    'links-testados': false,
    'assunto-aprovado': false,
    'publico-validado': false,
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [requestState, setRequestState] = useState('idle')

  useEffect(() => {
    const controller = new AbortController()

    fetch('/dispatch.json', {
      method: 'GET',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load dispatch data')
        }

        return response.json()
      })
      .then((data) => {
        setDispatchData(data)
        setLoadState('ready')
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setLoadState('error')
      })

    return () => controller.abort()
  }, [])

  const checklistItems = dispatchData ? buildChecklistItems(dispatchData) : []
  const allChecked = checklistItems.length > 0 && checklistItems.every(({ id }) => checkedItems[id])

  const toggleItem = (itemId) => {
    setCheckedItems((current) => ({
      ...current,
      [itemId]: !current[itemId],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!allChecked) return

    setRequestState('sending')

    fetch(dispatchData.approval.endpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
      },
      body: JSON.stringify({
        token: dispatchData.approval.token,
        user: dispatchData.user,
      }),
    })
      .then(() => {
        setRequestState('sent')
        setIsSubmitted(true)
      })
      .catch(() => {
        setRequestState('error')
      })
  }

  return (
    <main className={pageClass}>
      <header className={`${headerClass} flex items-center gap-3`}>
        <img src={logo} alt="Itaú logo" className="h-8 w-8 shrink-0 brightness-0 invert" />
        <span>Intranet</span>
      </header>

      <section className={containerClass}>
        <div className={cardClass}>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#EC7000]">
            Intranet · Campanhas
          </p>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Checklist de disparo
          </h1>
          <p className="mb-6 text-gray-600">
            Valide os itens obrigatórios antes de autorizar o envio.
          </p>

          <section className={sectionClass}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Resumo da campanha
            </h2>
            {loadState === 'loading' ? (
              <p className="text-sm text-gray-600">Carregando dados da campanha...</p>
            ) : loadState === 'error' ? (
              <p className="text-sm text-red-600">Não foi possível carregar dispatch.json.</p>
            ) : (
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-gray-500">Campanha</span>
                  <strong className="block text-gray-900">{dispatchData.campaign.name}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">Canal</span>
                  <strong className="block text-gray-900">{dispatchData.campaign.channel}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">Assunto</span>
                  <strong className="block text-gray-900">{dispatchData.campaign.subject}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">Agendamento</span>
                  <strong className="block text-gray-900">{dispatchData.campaign.scheduledFor}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">Usuário</span>
                  <strong className="block text-gray-900">{dispatchData.user.name}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">E-mail</span>
                  <strong className="block text-gray-900">{dispatchData.user.email}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">Responsável pela aprovação</span>
                  <strong className="block text-gray-900">{dispatchData.approval.recipientEmail}</strong>
                </div>
                <div>
                  <span className="block text-gray-500">Token enviado por e-mail</span>
                  <strong className="block text-gray-900 break-all">{dispatchData.approval.token}</strong>
                </div>
              </div>
            )}
          </section>

          {!isSubmitted && loadState === 'ready' ? (
            <>
              <div
                className={`mb-6 rounded-xl border p-4 ${
                  allChecked
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <strong className="block text-base">
                  {allChecked
                    ? 'Tudo validado'
                    : 'Aguardando validação'}
                </strong>
                <p className="text-sm text-gray-600">
                  {allChecked
                    ? 'Você já pode autorizar o disparo.'
                    : 'Marque todos os itens para continuar.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {checklistItems.map(({ id, title, description }) => (
                  <label
                    key={id}
                    className={labelClass}
                  >
                    <input
                      type="checkbox"
                      checked={checkedItems[id]}
                      onChange={() => toggleItem(id)}
                      className="mt-1 h-5 w-5 accent-[#EC7000]"
                    />
                    <div>
                      <strong className="block text-base">{title}</strong>
                      <p className="text-sm text-gray-600">{description}</p>
                    </div>
                  </label>
                ))}

                <button
                  type="submit"
                  disabled={!allChecked}
                  className={`${buttonBaseClass} ${
                    allChecked
                      ? 'bg-[#EC7000] hover:bg-[#d46500]'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {requestState === 'sending' ? 'Enviando aprovação...' : 'Autorizar disparo'}
                </button>
              </form>
            </>
          ) : !isSubmitted && loadState === 'loading' ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
              Aguardando os dados do dispatch para exibir a validação.
            </div>
          ) : !isSubmitted && loadState === 'error' ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Não foi possível abrir o dispatch.json.
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-green-50 border border-green-500">
              <h2 className="text-xl font-bold text-green-700 mb-1">
                Disparo liberado
              </h2>
              <p className="text-sm text-gray-700">
                Aprovação enviada.
              </p>
            </div>
          )}

          {requestState === 'error' ? (
            <p className="mt-4 text-sm text-red-600">
              Não foi possível concluir a requisição agora.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)