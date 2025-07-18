// api/chapters.js
import { readFile } from 'fs/promises'
import path from 'path'

export default async function handler(req, res) {
  const { book } = req.query
  if (!book) return res.status(400).json({ error: 'Missing ?book=' })

  // load your kjv.json
  const data = await readFile(path.join(process.cwd(), 'public/kjv.json'), 'utf8')
  const kjv = JSON.parse(data)

  if (!kjv[book]) {
    return res.status(404).json({ error: `Book "${book}" not found` })
  }

  // Assuming kjv[book] is an object whose keys are chapter numbers
  const chapters = Object.keys(kjv[book]).map(num => parseInt(num, 10))
  res.json({ chapters })
}