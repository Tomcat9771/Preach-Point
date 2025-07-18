// server.js
import express from 'express';
import fs from 'fs/promises';
import { OpenAI } from 'openai';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

// 1️⃣ Serve all front-end assets from './public'
app.use(express.static('public'));

// 2️⃣ Load kjv.json once at startup
let kjvData;
(async () => {
  try {
    const raw = await fs.readFile('public/kjv.json', 'utf8');
    const parsed = JSON.parse(raw);
    // Expecting { books: [ { name, chapters: [ { chapter, verses: [ { verse, text } ] } ] } ] }
    kjvData = parsed.books;
    console.log(`✅ Loaded ${kjvData.length} books from kjv.json`);
  } catch (err) {
    console.error('Failed to load kjv.json:', err);
    process.exit(1);
  }
})();

// 3️⃣ OpenAI client & in-memory cache
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cache   = new NodeCache({ stdTTL: 86400 }); // cache for 24h

// 4️⃣ Helper: extract verses across chapters
function extractVerses(bookName, startChap, startV, endChap, endV) {
  const bookObj = kjvData.find(b => b.name === bookName);
  if (!bookObj) throw new Error(`Book "${bookName}" not found`);

  const sC = Number(startChap), eC = Number(endChap);
  const sV = Number(startV), eV = Number(endV);
  const lines = [];

  for (let chap = sC; chap <= eC; chap++) {
    const chapObj = bookObj.chapters.find(c => c.chapter === chap);
    if (!chapObj) throw new Error(`Chapter "${chap}" not found in ${bookName}`);

    const verses = chapObj.verses.filter(v => {
      if (sC === eC) {
        return v.verse >= sV && v.verse <= eV;
      } else if (chap === sC) {
        return v.verse >= sV;
      } else if (chap === eC) {
        return v.verse <= eV;
      } else {
        return true;
      }
    });

    verses.forEach(v => lines.push(`${chap}:${v.verse} ${v.text}`));
  }

  if (lines.length === 0) {
    throw new Error(`No verses found in range ${startChap}:${startV}–${endChap}:${endV}`);
  }

  return lines.join('\n');
}

// 5️⃣ Endpoint: get chapters count
app.get('/api/chapters', (req, res) => {
  const book = req.query.book;
  if (!book) return res.status(400).json({ error: 'Missing book parameter' });
  const bookObj = kjvData.find(b => b.name === book);
  if (!bookObj) return res.status(400).json({ error: `Book ${book} not found` });
  const chapters = bookObj.chapters.map(c => c.chapter);
  res.json({ chapters });
});

// 6️⃣ Endpoint: get verses count for a chapter
app.get('/api/versesCount', (req, res) => {
  const book = req.query.book;
  const chapter = Number(req.query.chapter);
  if (!book || !chapter) return res.status(400).json({ error: 'Missing book or chapter parameter' });
  const bookObj = kjvData.find(b => b.name === book);
  if (!bookObj) return res.status(400).json({ error: `Book ${book} not found` });
  const chapObj = bookObj.chapters.find(c => c.chapter === chapter);
  if (!chapObj) return res.status(400).json({ error: `Chapter ${chapter} not found in ${book}` });
  const verses = chapObj.verses.map(v => v.verse);
  res.json({ verses });
});

// 7️⃣ Endpoint: fetch bible text (single or multi-chapter)
app.post('/api/verses', (req, res) => {
  try {
    const { book, startChapter, startVerse, endChapter, endVerse } = req.body;
    if (!book || !startChapter || !startVerse) {
      return res.status(400).json({ error: 'Missing book, startChapter, or startVerse' });
    }
    const sCh = startChapter;
    const eCh = endChapter || startChapter;
    const sV  = startVerse;
    const eV  = endVerse || startVerse;

    const text = extractVerses(book, sCh, sV, eCh, eV);
    res.json({ text });
  } catch (err) {
    console.error('Error in /api/verses:', err);
    res.status(400).json({ error: err.message });
  }
});

// 8️⃣ Endpoint: translate into Afrikaans
app.post('/api/translate', async (req, res) => {
  try {
    const { book, startChapter, startVerse, endChapter, endVerse } = req.body;
    if (!book || !startChapter || !startVerse) {
      return res.status(400).json({ error: 'Missing book, startChapter, or startVerse' });
    }
    const sCh = startChapter;
    const eCh = endChapter || startChapter;
    const sV  = startVerse;
    const eV  = endVerse || startVerse;
    const cacheKey = `${book}.${sCh}:${sV}-${eCh}:${eV}`;
    if (cache.has(cacheKey)) {
      return res.json({ translation: cache.get(cacheKey) });
    }
    const snippet = extractVerses(book, sCh, sV, eCh, eV);
    const prompt  = `Translate these Bible verses into Afrikaans, preserving verse numbers:\n\n${snippet}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a precise translator.' },
        { role: 'user',   content: prompt }
      ],
      temperature: 0
    });

    const translation = completion.choices[0].message.content.trim();
    cache.set(cacheKey, translation);
    res.json({ translation });
  } catch (err) {
    console.error('Error in /api/translate:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9️⃣ AI‑only commentary
app.post('/api/commentary', async (req, res) => {
  try {
    const { book, startChapter, startVerse, endChapter, endVerse, tone, level, lang } = req.body;
    if (!book || !startChapter || !startVerse) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const sCh = startChapter;
    const eCh = endChapter || startChapter;
    const sV  = startVerse;
    const eV  = endVerse   || startVerse;

    // 1) Extract the passage (multi‑chapter)
    const scripture = extractVerses(book, sCh, sV, eCh, eV);

    // 2) Build the reference string
    const passageRef = `${book} ${sCh}:${sV}` +
      ((eCh !== sCh || eV !== sV) ? `–${eCh}:${eV}` : '');

    // 3) Prepare a closed, single back‑tick prompt
    const prompt = `Here is the passage (${passageRef}):
${scripture}

Instructions:
• Base your remarks strictly on these verses.
• Briefly mention what the verses immediately before and after add to the meaning, but do not tell extra side‑stories.
• Do not add any information that isn’t contained in or directly implied by these verses or their immediate neighbors.

Now write a ${lang === 'af' ? 'Afrikaans' : 'English'} commentary at the "${level}" level with a "${tone}" tone.`;

    // 4) Call OpenAI
    const completion = await openai.chat.completions.create({
      model:      'gpt-4o-mini',
      temperature:0.7,
      max_tokens: 1500,
      messages: [
        {
          role:    'system',
          content: 'You are Preach Point AI, an expert Bible commentary assistant. Please focus strictly on the provided passage and its immediate context.'
        },
        {
          role:    'user',
          content: prompt
        }
      ]
    });

    // 5) Return the trimmed commentary
    const commentary = completion.choices[0].message.content.trim();
    res.json({ commentary });

  } catch (err) {
    console.error('Error in /api/commentary:', err);
    res.status(500).json({ error: err.message });
  }
});


// 🔟 Launch server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Preach Point server listening on http://localhost:${PORT}`);
});
