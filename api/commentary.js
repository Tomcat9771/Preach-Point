// api/commentary.js
import { Configuration, OpenAIApi } from 'openai'
import dotenv from 'dotenv'

dotenv.config()

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}))

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST' })

  const { book, startChapter, startVerse, endChapter, endVerse, tone, level, lang } = req.body
  if (!book || !startChapter || !startVerse) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  // build your prompt...
  const prompt = `
    Provide a ${level} ${lang === 'af' ? 'Afrikaans' : 'English'} commentary in a ${tone} style
    on ${book} ${startChapter}:${startVerse}-${endChapter || startChapter}:${endVerse || startVerse}.
  `

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
    const commentary = completion.data.choices[0].message.content
    // Optionally also return the raw passage text if you fetched it here
    res.json({ commentary })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'OpenAI request failed' })
  }
}