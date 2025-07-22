// ─── safeFetchJson helper ─────────────────────────────────────
/**
 * Fetches URL and returns parsed JSON, or throws with the raw text on error.
 */
async function safeFetchJson(url) {
  const res = await fetch(url);
  const txt = await res.text();
  if (!res.ok) {
    console.error('API error response:', txt);
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return JSON.parse(txt);
}

// ─── Localized Afrikaans book names (same order as /api/books) ──
const afBookNames = [
  "Genesis","Eksodus","Levitikus","Numeri","Deuteronomium","Josua",
  "Rigters","Rut","1 Samuel","2 Samuel","1 Konings","2 Konings",
  "1 Kronieke","2 Kronieke","Esra","Nehemia","Esther","Job","Psalms",
  "Spreuke","Prediker","Hooglied","Jesaja","Jeremia","Klaagliedere",
  "Esegiel","Daniël","Hosëa","Joël","Amos","Obadja","Jona","Miga",
  "Nahum","Habakkuk","Sefanja","Haggai","Sagaria","Maleagi",
  "Matteus","Markus","Lukas","Johannes","Handelinge","Romeine",
  "1 Korintiërs","2 Korintiërs","Galasiërs","Efe­siërs","Filippense",
  "Kolossense","1 Tessalonisense","2 Tessalonisense","1 Timoteus",
  "2 Timoteus","Titus","Filemon","Hebreërs","Jakobus","1 Petrus",
  "2 Petrus","1 Johannes","2 Johannes","3 Johannes","Judas","Openbaring"
];

// ─── Standard UI label data ─────────────────────────────────────
const toneOptions  = { en: ["Teaching","Encouragement","Evangelism"], af: ["Onderrig","Aanmoediging","Evangelies"] };
const levelOptions = { en: ["Short","Sermon-Style","Full Commentary"], af: ["Kort","Preek-Styl","Volledige Kommentaar"] };
const labels = {
  en: { lang:"Language", book:"Book", chapter:"Start Chapter", verse:"Start Verse", endChapter:"End Chapter", endVerse:"End Verse", tone:"Tone", level:"Explanation Level" },
  af: { lang:"Taal",    book:"Boek", chapter:"Begin Hoofstuk", verse:"Begin Vers",      endChapter:"Eind Hoofstuk",   endVerse:"Eind Vers",       tone:"Toon",  level:"Uitlegvlak" }
};
const buttonLabels = {
  en: { generate:"Generate Commentary", copy:"Copy to Clipboard", pdf:"Download as PDF" },
  af: { generate:"Genereer Kommentaar", copy:"Kopieer na klembord", pdf:"Laai af as PDF" }
};
const headingLabels = {
  en: { verses:"Bible Text", commentary:"Commentary" },
  af: { verses:"Bybelteks", commentary:"Kommentaar" }
};

// shorthand for document.getElementById
function $(id) { return document.getElementById(id); }

// ─── Populate the book <select> from /api/books ─────────────────
async function populateBooks() {
  let data;
  try {
    data = await safeFetchJson('/api/books');
  } catch (err) {
    console.error('Could not load books list:', err);
    return;
  }
  const bookSelect = $('book');
  bookSelect.innerHTML = '';
  bookSelect.append(new Option('— Select a Book —', ''));
  if ($('lang').value === 'af') {
    // show Afrikaans names, but keep the value = English key
    data.books.forEach((engName, i) => {
      bookSelect.append(new Option(afBookNames[i], engName));
    });
  } else {
    data.books.forEach(name => {
      bookSelect.append(new Option(name, name));
    });
  }
}

// ─── Populate chapters after a book is chosen ───────────────────
async function populateChapters() {
  const loc      = $('lang').value;
  const bookName = $('book').value;
  const sel0     = $('chapter');
  const sel1     = $('end-chapter');

  sel0.innerHTML = '';
  sel1.innerHTML = '';
  sel0.append(new Option(labels[loc].chapter,''));
  sel1.append(new Option(labels[loc].endChapter,''));

  if (!bookName) return;

  let js;
  try {
    js = await safeFetchJson(`/api/chapters?book=${encodeURIComponent(bookName)}`);
  } catch (err) {
    alert(`Could not load chapters: ${err.message}`);
    return;
  }

  js.chapters.forEach(num => {
    sel0.append(new Option(num, num));
    sel1.append(new Option(num, num));
  });
}

// ─── Populate verses after a chapter is chosen ──────────────────
async function populateVerses() {
  const loc      = $('lang').value;
  const bookName = $('book').value;
  const chap     = $('chapter').value;
  const sel0     = $('verse');
  const sel1     = $('end-verse');

  sel0.innerHTML = '';
  sel1.innerHTML = '';
  sel0.append(new Option(labels[loc].verse,''));
  sel1.append(new Option(labels[loc].endVerse,''));

  if (!bookName || !chap) return;

  let js;
  try {
    js = await safeFetchJson(
      `/api/versesCount?book=${encodeURIComponent(bookName)}&chapter=${chap}`
    );
  } catch (err) {
    alert(`Could not load verses: ${err.message}`);
    return;
  }

  js.verses.forEach(num => {
    sel0.append(new Option(num, num));
    sel1.append(new Option(num, num));
  });
}

// ─── Populate tone & level selects ──────────────────────────────
function populateTone() {
  const loc = $('lang').value;
  const sel = $('tone');
  sel.innerHTML = '';
  toneOptions[loc].forEach(o => sel.append(new Option(o, o.toLowerCase())));
}
function populateLevels() {
  const loc = $('lang').value;
  const sel = $('level');
  sel.innerHTML = '';
  levelOptions[loc].forEach(o =>
    sel.append(new Option(o, o.toLowerCase().replace(/\s+/g,'-')))
  );
}

// ─── Update all labels, then repopulate dropdowns ───────────────
function updateUI() {
  const loc = $('lang').value;
  const L   = labels[loc];
  $('lang-label').textContent        = L.lang;
  $('book-label').textContent        = L.book;
  $('chapter-label').textContent     = L.chapter;
  $('verse-label').textContent       = L.verse;
  $('end-chapter-label').textContent = L.endChapter;
  $('end-verse-label').textContent   = L.endVerse;
  $('tone-label').textContent        = L.tone;
  $('level-label').textContent       = L.level;
  updateButtonsAndHeadings(loc);

  populateBooks();
  populateChapters();
  populateVerses();
  populateTone();
  populateLevels();
}

// ─── Wire up event listeners ─────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  updateUI();
  $('lang').addEventListener('change', updateUI);
  $('book').addEventListener('change', populateChapters);
  $('chapter').addEventListener('change', populateVerses);
  $('generate-btn').addEventListener('click', onGenerate);
  $('copy-btn').addEventListener('click', onCopy);
  $('download-pdf').addEventListener('click', onDownloadPDF);
});

// ─── Generate & display commentary ───────────────────────────────
async function onGenerate() {
  const lang     = $('lang').value;
  const bookName = $('book').value;
  const sCh      = $('chapter').value;
  const sV       = $('verse').value;
  const eCh      = $('end-chapter').value || sCh;
  const eV       = $('end-verse').value   || sV;
  const tone     = $('tone').value;
  const lvl      = $('level').value;

  if (!bookName || !sCh || !sV) {
    alert('Please select a book, chapter & verse.');
    return;
  }

  // Fetch & render verses (or translation)
  try {
    const url = lang === 'af' ? '/api/translate' : '/api/verses';
    const payload = { book: bookName, startChapter: sCh, startVerse: sV, endChapter: eCh, endVerse: eV };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const js = await res.json();
    if (!res.ok) throw new Error(js.error || 'Fetch error');
    $('verses').textContent = lang === 'af' ? js.translation : js.text;
  } catch (e) {
    $('verses').textContent = `Error: ${e.message}`;
    return;
  }

  // Fetch & render AI commentary
  $('commentary').textContent = 'Generating…';
  try {
    const payload = { book: bookName, startChapter: sCh, startVerse: sV, endChapter: eCh, endVerse: eV, tone, level: lvl, lang };
    const res2 = await fetch('/api/commentary', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const js2 = await res2.json();
    if (!res2.ok) throw new Error(js2.error || 'Commentary error');
    $('commentary').textContent = js2.commentary;
  } catch (e) {
    $('commentary').textContent = `Error: ${e.message}`;
  }
}

// ─── Copy to clipboard helper ────────────────────────────────────
function onCopy() {
  const loc = $('lang').value;
  const text = `${labels[loc].tone}: ${$('tone').value}\n` +
               `${labels[loc].level}: ${$('level').value}\n\n` +
               $('verses').textContent + '\n\n' +
               $('commentary').textContent;
  navigator.clipboard.writeText(text)
    .then(() => alert('Copied!'))
    .catch(e => alert('Copy failed:'+e));
}

// ─── Your existing onDownloadPDF (unchanged) ────────────────────


/**
 * Generates a PDF of the current commentary view.
 */
function onDownloadPDF() {
  const loc  = $('lang').value;
  const vh   = headingLabels[loc].verses;
  const ch   = headingLabels[loc].commentary;
  const tmp  = document.createElement('div');

  // Style wrapper for PDF
  tmp.style.padding    = '40px';
  tmp.style.background = 'white';
  tmp.style.color      = 'black';

  // Build the HTML to render into PDF
  tmp.innerHTML = `
    <div style="text-align:center; margin-bottom:2rem;">
      <img
        src="/logo.png"
        style="max-width:200px; height:auto; display:block; margin:0 auto 1rem;"
        alt="Preach Point Logo"
      />
    </div>
    <div style="text-align:center; margin-bottom:1rem; font-size:1.2em; line-height:1.1;">
      <strong>${labels[loc].tone}:</strong> ${$('tone').value}
      &nbsp;&nbsp;
      <strong>${labels[loc].level}:</strong> ${$('level').value}
    </div>
    <hr/>
    <h2 style="font-size:3.6em; text-align:center;">${vh}</h2>
    <pre style="font-size:1.1em; line-height:1.4; white-space:pre-wrap;">
${$('verses').textContent}
    </pre>
    <h2 style="font-size:3.6em; text-align:center;">${ch}</h2>
    <pre style="font-size:1.1em; line-height:1.4; white-space:pre-wrap;">
${$('commentary').textContent}
    </pre>
  `;  // <-- closing back‐tick for template literal

  document.body.appendChild(tmp);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

  pdf.html(tmp, {
    x: 20,
    y: 20,
    width: pdf.internal.pageSize.getWidth() - 40,
    windowWidth: document.body.scrollWidth,
    callback: () => {
      pdf.save('preachpoint_commentary.pdf');
      document.body.removeChild(tmp);
    }
  });
}  // <-- closing brace for function
