import { useEffect, useState } from 'react'

export default function App() {
  const [api, setApi] = useState('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { status: string }) => setApi(data.status))
      .catch(() => setApi('unreachable'))
  }, [])

  return (
    <main>
      <h1>IoT Designer</h1>
      <p>API: {api}</p>
    </main>
  )
}
