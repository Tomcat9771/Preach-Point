
import { useState, useEffect, useRef } from 'react'

// Data from script.js
const booksData = {
  en: ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"],
  af:  ["Genesis","Eksodus","Levitikus","Numeri","Deuteronomium","Josua","Rigters","Rut","1 Samuel","2 Samuel","1 Konings","2 Konings","1 Kronieke","2 Kronieke","Esra","Nehemia","Esther","Job","Psalms","Spreuke","Prediker","Hooglied","Jesaja","Jeremia","Klaagliedere","Esegiel","Daniël","Hosëa","Joël","Amos","Obadja","Jona","Miga","Nahum","Habakkuk","Sefanja","Haggai","Sagaria","Maleagi","Matteus","Markus","Lukas","Johannes","Handelinge","Romeine","1 Korintiërs","2 Korintiërs","Galasiërs","Efe­siërs","Filippense","Kolossense","1 Tessalonisense","2 Tessalonisense","1 Timoteus","2 Timoteus","Titus","Filemon","Hebreërs","Jakobus","1 Petrus","2 Petrus","1 Johannes","2 Johannes","3 Johannes","Judas","Openbaring"]
}
const toneOptions = {
  en: ["Teaching","Encouragement","Evangelism"],
  af: ["Onderrig","Aanmoediging","Evangelies"]
}
const levelOptions = {
  en: ["Short","Sermon-Style","Full Commentary"],
  af: ["Kort","Preek-Styl","Volledige Kommentaar"]
}
const labels = {
  en: { lang:"Language", book:"Book", chapter:"Start Chapter", verse:"Start Verse", endChapter:"End Chapter", endVerse:"End Verse", tone:"Tone", level:"Explanation Level" },
  af: { lang:"Taal", book:"Boek", chapter:"Begin Hoofstuk", verse:"Begin Vers", endChapter:"Eind Hoofstuk", endVerse:"Eind Vers", tone:"Toon", level:"Uitlegvlak" }
}
const buttonLabels = {
  en: { generate:"Generate Commentary", copy:"Copy to Clipboard", pdf:"Download as PDF" },
  af: { generate:"Genereer Kommentaar", copy:"Kopieer na klembord", pdf:"Laai af as PDF" }
}
const headingLabels = {
  en: { verses:"Bible Text", commentary:"Commentary" },
  af: { verses:"Bybelteks", commentary:"Kommentaar" }
}

export default function App() {
  const [lang, setLang]           = useState('en')
  const [bookIdx, setBookIdx]     = useState('')
  const [chapters, setChapters]   = useState([])
  const [verses, setVerses]       = useState([])
  const [chapterStart, setChapterStart] = useState('')
  const [verseStart, setVerseStart]     = useState('')
  const [chapterEnd, setChapterEnd]     = useState('')
  const [verseEnd, setVerseEnd]         = useState('')
  const [tone, setTone]           = useState(toneOptions.en[0])
  const [level, setLevel]         = useState(levelOptions.en[0])
  const [passage, setPassage]     = useState('')
  const [commentary, setCommentary] = useState('')
  const [loading, setLoading]     = useState(false)
  const printRef = useRef()

  // Update dependant arrays on language change
  useEffect(() => {
    setBookIdx('')
    setChapters([])
    setVerses([])
    setChapterStart('')
    setVerseStart('')
    setChapterEnd('')
    setVerseEnd('')
    setTone(toneOptions[lang][0])
    setLevel(levelOptions[lang][0])
  }, [lang])

  // Fetch chapters when book changes
  useEffect(() => {
    async function loadCh() {
      if (!bookIdx) return
      const idx = parseInt(bookIdx,10)-1
      const bookName = booksData.en[idx]
      const res = await fetch(`/api/chapters?book=${encodeURIComponent(bookName)}`)
      const json = await res.json()
      setChapters(json.chapters)
      setChapterStart('')
      setChapterEnd('')
      setVerses([])
    }
    loadCh()
  }, [bookIdx])

  // Fetch verses when start chapter changes
  useEffect(() => {
    async function loadVs() {
      if (!bookIdx||!chapterStart) return
      const idx = parseInt(bookIdx,10)-1
      const bookName = booksData.en[idx]
      const res = await fetch(`/api/versesCount?book=${encodeURIComponent(bookName)}&chapter=${chapterStart}`)
      const json = await res.json()
      setVerses(json.verses)
      setVerseStart('')
      setVerseEnd('')
    }
    loadVs()
  }, [bookIdx, chapterStart])

  const handleGenerate = async e => {
    e.preventDefault(); setLoading(true); setPassage(''); setCommentary('')
    try {
      const payload = { book: booksData.en[parseInt(bookIdx,10)-1], startChapter: chapterStart, startVerse: verseStart, endChapter: chapterEnd, endVerse: verseEnd, tone, level, lang }
      const res = await fetch('/api/commentary', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
      const js = await res.json()
      setPassage(js.passage||'')
      setCommentary(js.commentary||'')
    } catch(err) {
      console.error(err)
      setPassage('Error fetching passage')
      setCommentary('Error generating commentary')
    } finally { setLoading(false) }
  }

  const handleCopy = () => {
    const txt = `Passage:\n${passage}\n\nCommentary:\n${commentary}`
    navigator.clipboard.writeText(txt)
  }

  const handleDownload = () => window.print()

  const L = labels[lang]
  const BTN = buttonLabels[lang]
  const HD = headingLabels[lang]

  return (
    <div className="min-h-screen bg-purple-800 text-white p-6">
      <div className="max-w-3xl mx-auto" ref={printRef}>
        <h1 className="text-4xl font-bold mb-6">Preach Point</h1>
        <form onSubmit={handleGenerate} className="space-y-4">
          {/* Language */}
          <div>
            <label className="block mb-1">{L.lang}</label>
            <select className="w-full p-2 rounded" value={lang} onChange={e=>setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="af">Afrikaans</option>
            </select>
          </div>
          {/* Book */}
          <div>
            <label className="block mb-1">{L.book}</label>
            <select className="w-full p-2 rounded" value={bookIdx} onChange={e=>setBookIdx(e.target.value)}>
              <option value="">---</option>
              {booksData[lang].map((b,i)=><option key={i} value={i+1}>{b}</option>)}
            </select>
          </div>
          {/* Chapters & Verses */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">{L.chapter}</label>
              <select className="w-full p-2 rounded" value={chapterStart} onChange={e=>setChapterStart(e.target.value)}>
                <option value="">{L.chapter}</option>
                {chapters.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">{L.verse}</label>
              <select className="w-full p-2 rounded" value={verseStart} onChange={e=>setVerseStart(e.target.value)}>
                <option value="">{L.verse}</option>
                {verses.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">{L.endChapter}</label>
              <select className="w-full p-2 rounded" value={chapterEnd} onChange={e=>setChapterEnd(e.target.value)}>
                <option value="">{L.endChapter}</option>
                {chapters.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">{L.endVerse}</label>
              <select className="w-full p-2 rounded" value={verseEnd} onChange={e=>setVerseEnd(e.target.value)}>
                <option value="">{L.endVerse}</option>
                {verses.map(n=><option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          {/* Tone & Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">{L.tone}</label>
              <select className="w-full p-2 rounded" value={tone} onChange={e=>setTone(e.target.value)}>
                {toneOptions[lang].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block mb-1">{L.level}</label>
              <select className="w-full p-2 rounded" value={level} onChange={e=>setLevel(e.target.value)}>
                {levelOptions[lang].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          {/* Generate */}
          <button type="submit" className="w-full bg-white text-purple-800 py-2 rounded" disabled={loading||!bookIdx||!chapterStart||!verseStart||!chapterEnd||!verseEnd}>
            {loading? 'Loading…': BTN.generate}
          </button>
        </form>
        {/* Passage */}
        {passage && (
          <section className="mt-6 bg-white text-black p-4 rounded">
            <h2 className="font-semibold mb-2">{HD.verses}</h2>
            <pre className="whitespace-pre-wrap">{passage}</pre>
          </section>
        )}
        {/* Commentary & Actions */}
        {commentary && (
          <section className="mt-4 bg-white text-black p-4 rounded">
            <h2 className="font-semibold mb-2">{HD.commentary}</h2>
            <pre className="whitespace-pre-wrap">{commentary}</pre>
            <div className="mt-3 space-x-2">
              <button onClick={handleCopy} className="px-3 py-1 bg-purple-600 text-white rounded">{BTN.copy}</button>
              <button onClick={handleDownload} className="px-3 py-1 bg-purple-600 text-white rounded">{BTN.pdf}</button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
