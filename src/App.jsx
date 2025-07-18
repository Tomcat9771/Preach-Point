import { useState, useEffect } from 'react'

// List of all 66 books of the Bible
const books = [
  "Genesis","Exodus","Leviticus","Numbers","Deuteronomy",
  "Joshua","Judges","Ruth","1 Samuel","2 Samuel",
  "1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
  "Nehemiah","Esther","Job","Psalms","Proverbs",
  "Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations",
  "Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk",
  "Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans",
  "1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"
]

// Supported translations
const translations = [
  { label: 'English (KJV)', value: 'kjv' },
  { label: 'Afrikaans (Afr1953)', value: 'afr1953' }
]

// helper to make [1,2,…n]
const range = n => Array.from({ length: n }, (_, i) => i + 1)

export default function App() {
  const [translation, setTranslation] = useState(translations[0].value)
  const [book, setBook] = useState(books[0])
  const [chapter, setChapter] = useState(1)
  const [startVerse, setStartVerse] = useState(1)
  const [endVerse, setEndVerse] = useState(3)
  const [passage, setPassage] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchPassage = async e => {
    e.preventDefault()
    setLoading(true)
    setPassage('')
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translation, book, chapter, startVerse, endVerse })
      })
      const { translation: text } = await res.json()
      setPassage(text)
    } catch (err) {
      console.error(err)
      setPassage('Error fetching passage.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-6">Preach Point</h1>
      <form onSubmit={fetchPassage} className="space-y-4">
        <div>
          <label className="block mb-1">Translation / Taal</label>
          <select
            className="w-full p-2 border rounded"
            value={translation}
            onChange={e => setTranslation(e.target.value)}
          >
            {translations.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Book / Boek</label>
          <select
            className="w-full p-2 border rounded"
            value={book}
            onChange={e => setBook(e.target.value)}
          >
            {books.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block mb-1">Chapter / Hoofstuk</label>
          <select
            className="w-full p-2 border rounded"
            value={chapter}
            onChange={e => setChapter(+e.target.value)}
          >
            {range(150).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Start Verse / Begin Vers</label>
            <select
              className="w-full p-2 border rounded"
              value={startVerse}
              onChange={e => setStartVerse(+e.target.value)}
            >
              {range(150).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-1">End Verse / Einde Vers</label>
            <select
              className="w-full p-2 border rounded"
              value={endVerse}
              onChange={e => setEndVerse(+e.target.value)}
            >
              {range(150).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full p-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={loading || endVerse < startVerse}
        >
          {loading ? 'Loading…' : 'Fetch Passage'}
        </button>
      </form>

      {endVerse < startVerse && (
        <p className="mt-2 text-red-600">End verse moet ≥ begin vers wees.</p>
      )}

      {passage && (
        <pre className="mt-6 p-4 bg-gray-100 rounded whitespace-pre-wrap">
          {passage}
        </pre>
      )}
    </div>
  )
}
