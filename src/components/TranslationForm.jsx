// src/components/TranslationForm.jsx
import { useState } from 'react';

export default function TranslationForm({ onSubmit }) {
  const [book, setBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(3);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ book, chapter, startVerse, endVerse });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label>Book:</label>
        <input value={book} onChange={e => setBook(e.target.value)} />
      </div>
      <div>
        <label>Chapter:</label>
        <input
          type="number"
          value={chapter}
          onChange={e => setChapter(Number(e.target.value))}
        />
      </div>
      <div className="flex space-x-4">
        <div>
          <label>Start Verse:</label>
          <input
            type="number"
            value={startVerse}
            onChange={e => setStartVerse(Number(e.target.value))}
          />
        </div>
        <div>
          <label>End Verse:</label>
          <input
            type="number"
            value={endVerse}
            onChange={e => setEndVerse(Number(e.target.value))}
          />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 rounded bg-blue-500 text-white">
        Fetch Passage
      </button>
    </form>
  );
}
