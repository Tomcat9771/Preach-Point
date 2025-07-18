import { useState } from 'react'

export default function App() {
  const [book, setBook] = useState('Genesis')
  const [chapter, setChapter] = useState(1)
  const [startVerse, setStartVerse] = useState(1)
  const [endVerse, setEndVerse] = useState(3)
  const [passage, setPassage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book, chapter, startVerse, endChapter: endVerse, endVerse })
      })
      const { translation } = await res.json()
      setPassage(translation)
    } catch {
      setPassage('Error fetching passage.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Preach Point</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Book dropdown, Chapter, Verses etc… */}
        <button type="submit" disabled={loading || endVerse < startVerse}>
          {loading ? 'Loading…' : 'Fetch Passage'}
        </button>
      </form>
      {passage && <pre className="mt-6 p-4 bg-gray-100 rounded">{passage}</pre>}
    </div>
  )
}

