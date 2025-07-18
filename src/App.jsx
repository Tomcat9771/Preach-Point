
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
  en: {
    lang: "Language", book: "Book",
    chapter: "Start Chapter", verse: "Start Verse",
    endChapter: "End Chapter", endVerse: "End Verse",
    tone: "Tone", level: "Explanation Level"
  },
  af: {
    lang: "Taal", book: "Boek",
    chapter: "Begin Hoofstuk", verse: "Begin Vers",
    endChapter: "Eind Hoofstuk", endVerse: "Eind Vers",
    tone: "Toon", level: "Uitlegvlak"
  }
}
const buttonLabels = {
  en: { generate: "Generate Commentary", copy: "Copy to Clipboard", pdf: "Download as PDF" },
  af: { generate: "Genereer Kommentaar", copy: "Kopieer na klembord", pdf: "Laai af as PDF" }
}
const headingLabels = {
  en: { verses: "Bible Text", commentary: "Commentary" },
  af: { verses: "Bybelteks", commentary: "Kommentaar" }
}

export default function App() {
  const [lang, setLang]       = useState('en')
  const [bookIdx, setBookIdx] = useState('')
  const [chapters, setChapters] = useState([])
  const [verses, setVerses]   = useState([])

  const [chapterStart, setChapterStart] = useState('')
  const [verseStart, setVerseStart]     = useState('')
  const [chapterEnd, setChapterEnd]     = useState('')
  const [verseEnd, setVerseEnd]         = useState('')

  const [tone, setTone]     = useState(toneOptions.en[0])
  const [level, setLevel]   = useState(levelOptions.en[0])

  const [passage, setPassage]     = useState('')
  const [commentary, setCommentary] = useState('')
  const [loading, setLoading]     = useState(false)
  const printRef = useRef()

  // reset dependent fields on language switch
  useEffect(() => {
    setBookIdx(''); setChapters([]); setVerses([])
    setChapterStart(''); setVerseStart('')
    setChapterEnd(''); setVerseEnd('')
    setTone(toneOptions[lang][0])
    setLevel(levelOptions[lang][0])
  }, [lang])

  // load chapters when book changes
  useEffect(() => {
    if (!bookIdx) return
    const bookName = booksData.en[bookIdx-1]
    fetch(`/api/chapters?book=${encodeURIComponent(bookName)}`)
      .then(res => res.json())
      .then(js => {
        setChapters(js.chapters || [])
        setChapterStart('')
        setChapterEnd('')
        setVerses([])
      })
      .catch(()=> setChapters([]))
  }, [bookIdx])

  // load verses when start chapter changes
  useEffect(() => {
    if (!bookIdx || !chapterStart) return
    const bookName = booksData.en[bookIdx-1]
    fetch(`/api/versesCount?book=${encodeURIComponent(bookName)}&chapter=${chapterStart}`)
      .then(res => res.json())
      .then(js => {
        setVerses(js.verses || [])
        setVerseStart('')
        setVerseEnd('')
      })
      .catch(()=> setVerses([]))
  }, [bookIdx, chapterStart])

  const handleGenerate = async e => {
    e.preventDefault()
    setLoading(true); setPassage(''); setCommentary('')
    try {
      const payload = {
        book: booksData.en[bookIdx-1],
        startChapter: chapterStart,
        startVerse: verseStart,
        endChapter: chapterEnd,
        endVerse: verseEnd,
        tone, level, lang
      }
      const res = await fetch('/api/commentary', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      })
      const js = await res.json()
      setPassage(js.passage || '')
      setCommentary(js.commentary || '')
    } catch (err) {
      console.error(err)
      setPassage('Error fetching passage')
      setCommentary('Error generating commentary')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`Passage:\n${passage}\n\nCommentary:\n${commentary}`)
  }
  const handleDownload = () => window.print()

  const L   = labels[lang]
  const BTN = buttonLabels[lang]
  const HD  = headingLabels[lang]

  return (
    <div className="container" ref={printRef}>
      <header className="app-title">
        <img src={logo} alt="Preach Point Logo" className="logo"/>
      </header>
      <h1>Preach Point</h1>

      <form onSubmit={handleGenerate}>
        <label>{L.lang}</label>
        <select value={lang} onChange={e=>setLang(e.target.value)}>
          <option value="en">English</option>
          <option value="af">Afrikaans</option>
        </select>

        <label>{L.book}</label>
        <select value={bookIdx} onChange={e=>setBookIdx(e.target.value)}>
          <option value="">---</option>
          {booksData[lang].map((b,i)=>(
            <option key={i} value={i+1}>{b}</option>
          ))}
        </select>

        <label>{L.chapter}</label>
        <select value={chapterStart} onChange={e=>setChapterStart(e.target.value)}>
          <option value="">{L.chapter}</option>
          {chapters.map(n=>(
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <label>{L.verse}</label>
        <select value={verseStart} onChange={e=>setVerseStart(e.target.value)}>
          <option value="">{L.verse}</option>
          {verses.map(n=>(
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <label>{L.endChapter}</label>
        <select value={chapterEnd} onChange={e=>setChapterEnd(e.target.value)}>
          <option value="">{L.endChapter}</option>
          {chapters.map(n=>(
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <label>{L.endVerse}</label>
        <select value={verseEnd} onChange={e=>setVerseEnd(e.target.value)}>
          <option value="">{L.endVerse}</option>
          {verses.map(n=>(
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <label>{L.tone}</label>
        <select value={tone} onChange={e=>setTone(e.target.value)}>
          {toneOptions[lang].map(o=>(
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <label>{L.level}</label>
        <select value={level} onChange={e=>setLevel(e.target.value)}>
          {levelOptions[lang].map(o=>(
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <button
          type="submit"
          disabled={
            loading ||
            !bookIdx ||
            !chapterStart ||
            !verseStart ||
            !chapterEnd ||
            !verseEnd
          }
        >
          {loading ? 'Loading…' : BTN.generate}
        </button>
      </form>

      <div id="output">
        {passage && (
          <>
            <h2>{HD.verses}</h2>
            <div>{passage}</div>
          </>
        )}
        {commentary && (
          <>
            <h2>{HD.commentary}</h2>
            <div>{commentary}</div>
            <div className="actions">
              <button onClick={handleCopy}>{BTN.copy}</button>
              <button onClick={handleDownload}>{BTN.pdf}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
