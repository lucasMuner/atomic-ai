import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('carregando...')

  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.status))
      .catch(() => setStatus('erro ao conectar'))
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-white">
        Status da API: {status}
      </h1>
    </div>
  )
}

export default App