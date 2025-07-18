// api/versesCount.js
import { readFile } from 'fs/promises'
import path from 'path'

export default async function handler(req, res) {
  const { book, chapter } = req.query
  if (!book || !chapter) return res.status(400).json({ error: 'Missing book or chapter' })

  const data = await readFile(path.join(process.cwd(), 'public/kjv.json'), 'utf8')
  const kjv = JSON.parse(data)

  const chapNum = parseInt(chapter, 10)
  if (!kjv[book] || !kjv[book][chapNum]) {
    return res.status(404).json({ error: `No chapter ${chapter} in "${book}"` })
  }

  // Assume kjv[book][chapNum] is an array of verses
  const verses = kjv[book][chapNum].map((_, i) => i + 1)
  res.json({ verses })
}
