// script.js – Preach Point (fixed)
/**
 * Fetch JSON from `url`, throwing if HTTP status is not OK,
 * and never trying to json()–parse an HTML error page.
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

// === Data for all the dropdowns ===
const books = {
  en: ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth",
       "1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra",
       "Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon",
       "Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
       "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah",
       "Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians",
       "2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians",
       "2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James",
       "1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"],
  af: ["Genesis","Eksodus","Levitikus","Numeri","Deuteronomium","Josua","Rigters","Rut",
       "1 Samuel","2 Samuel","1 Konings","2 Konings","1 Kronieke","2 Kronieke","Esra",
       "Nehemia","Esther","Job","Psalms","Spreuke","Prediker","Hooglied","Jesaja",
       "Jeremia","Klaagliedere","Esegiel","Daniël","Hosëa","Joël","Amos","Obadja",
       "Jona","Miga","Nahum","Habakkuk","Sefanja","Haggai","Sagaria","Maleagi",
       "Matteus","Markus","Lukas","Johannes","Handelinge","Romeine","1 Korintiërs",
       "2 Korintiërs","Galasiërs","Efe­siërs","Filippense","Kolossense","1 Tessalonisense",
       "2 Tessalonisense","1 Timoteus","2 Timoteus","Titus","Filemon","Hebreërs",
       "Jakobus","1 Petrus","2 Petrus","1 Johannes","2 Johannes","3 Johannes","Judas","Openbaring"]
};
const toneOptions = {
  en: ["Teaching","Encouragement","Evangelism"],
  af: ["Onderrig","Aanmoediging","Evangelies"]
};
const levelOptions = {
  en: ["Short","Sermon-Style","Full Commentary"],
  af: ["Kort","Preek-Styl","Volledige Kommentaar"]
};
const labels = {
  en: { lang:"Language", book:"Book", chapter:"Start Chapter", verse:"Start Verse", endChapter:"End Chapter", endVerse:"End Verse", tone:"Tone", level:"Explanation Level" },
  af: { lang:"Taal", book:"Boek", chapter:"Begin Hoofstuk", verse:"Begin Vers", endChapter:"Eind Hoofstuk", endVerse:"Eind Vers", tone:"Toon", level:"Uitlegvlak" }
};
const buttonLabels = {
  en: { generate:"Generate Commentary", copy:"Copy to Clipboard", pdf:"Download as PDF" },
  af: { generate:"Genereer Kommentaar", copy:"Kopieer na klembord", pdf:"Laai af as PDF" }
};
const headingLabels = {
  en: { verses:"Bible Text", commentary:"Commentary" },
  af: { verses:"Bybelteks", commentary:"Kommentaar" }
};

function $(id) { return document.getElementById(id); }

// Initialize UI
window.addEventListener('DOMContentLoaded', () => {
  updateUI();
  $('lang').addEventListener('change', updateUI);
  $('book').addEventListener('change', populateChapters);
  $('chapter').addEventListener('change', populateVerses);
  $('generate-btn').addEventListener('click', onGenerate);
  $('copy-btn').addEventListener('click', onCopy);
  $('download-pdf').addEventListener('click', onDownloadPDF);
});

function updateUI() {
  const loc = $('lang').value;
  const L = labels[loc] || labels.en;
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

function populateBooks() {
  const loc = $('lang').value;
  const sel = $('book');
  sel.innerHTML = '';
  sel.append(new Option('---',''));
  books[loc].forEach((b,i) => sel.append(new Option(b,i+1)));
}

async function populateChapters() {
  const loc = $('lang').value;
  const raw = $('book').value;
  const idx = Number(raw) - 1;
  const sel0 = $('chapter'), sel1 = $('end-chapter');
  sel0.innerHTML = '';
  sel1.innerHTML = '';
  sel0.append(new Option(labels[loc].chapter,''));
  sel1.append(new Option(labels[loc].endChapter,''));
  if (isNaN(idx) || idx < 0 || idx >= books.en.length) {
  return;   // no valid book selected
  const bookName = books.en[idx];
    // New, safe fetch:
  let js;
  try {
    js = await safeFetchJson(
      `/api/chapters?book=${encodeURIComponent(bookName)}`
    );
  } catch (err) {
    alert(`Could not load chapters: ${err.message}`);
    return;
  }
  js.chapters.forEach(num => {
    sel0.append(new Option(num,num));
    sel1.append(new Option(num,num));
  });
}

async function populateVerses() {
  const loc = $('lang').value;
  const raw = $('book').value;
  const idx = Number(raw) - 1;
  const chap = $('chapter').value;
  const sel0 = $('verse'), sel1 = $('end-verse');
  sel0.innerHTML = '';
  sel1.innerHTML = '';
  sel0.append(new Option(labels[loc].verse,''));
  sel1.append(new Option(labels[loc].endVerse,''));
  if (isNaN(idx) || !chap) return;
  const bookName = books.en[idx];
  const res = await fetch(`/api/versesCount?book=${encodeURIComponent(bookName)}&chapter=${chap}`);
  const js = await res.json();
  js.verses.forEach(num => {
    sel0.append(new Option(num,num));
    sel1.append(new Option(num,num));
  });
}

function populateTone() {
  const loc = $('lang').value;
  const sel = $('tone');
  sel.innerHTML = '';
  toneOptions[loc].forEach(o => sel.append(new Option(o,o.toLowerCase())));
}

function populateLevels() {
  const loc = $('lang').value;
  const sel = $('level');
  sel.innerHTML = '';
  levelOptions[loc].forEach(o => sel.append(new Option(o,o.toLowerCase().replace(/\s+/g,'-'))));
}

function updateButtonsAndHeadings(loc) {
  $('generate-btn').textContent  = buttonLabels[loc].generate;
  $('copy-btn').textContent      = buttonLabels[loc].copy;
  $('download-pdf').textContent  = buttonLabels[loc].pdf;
  $('verses-heading').textContent     = headingLabels[loc].verses;
  $('commentary-heading').textContent = headingLabels[loc].commentary;
}

// Fetch scripture or translation with multi-chapter support
async function fetchBibleText(bkIdx, sCh, sV, eCh, eV, lang) {
  const bookName = books.en[bkIdx];
  const payload = {
    book:         bookName,
    startChapter: sCh,
    startVerse:   sV,
    endChapter:   eCh||sCh,
    endVerse:     eV||sV
  };
  const url = lang==='af' ? '/api/translate' : '/api/verses';
  const res = await fetch(url, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
  });
  const js = await res.json();
  if (!res.ok) throw new Error(js.error||'Fetch error');
  return lang==='af' ? js.translation : js.text;
}

async function onGenerate() {
  const lang  = $('lang').value;
  const idx   = parseInt($('book').value,10)-1;
  const sCh   = $('chapter').value;
  const sV    = $('verse').value;
  const eCh   = $('end-chapter').value;
  const eV    = $('end-verse').value;
  const tone  = $('tone').value;
  const lvl   = $('level').value;

  // Fetch and display verses
  try {
    const text = await fetchBibleText(idx, sCh, sV, eCh, eV, lang);
    $('verses').textContent = text;
  } catch(e) {
    $('verses').textContent = `Error: ${e.message}`;
    return;
  }

  // Generate AI commentary
  $('commentary').textContent = 'Generating…';
  const payload = { book: books.en[idx], startChapter: sCh, startVerse: sV, endChapter: eCh, endVerse: eV, tone, level: lvl, lang };
  const res = await fetch('/api/commentary', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
  const js = await res.json();
  $('commentary').textContent = res.ok ? js.commentary : `Error: ${js.error}`;
}

function onCopy() {
  const loc = $('lang').value;
  const fullText = `${labels[loc].tone}: ${$('tone').value}\n` +
                   `${labels[loc].level}: ${$('level').value}\n\n` +
                   `${$('verses').textContent}\n\n` +
                   `${$('commentary').textContent}`;
  navigator.clipboard.writeText(fullText).then(()=>alert('Copied!')).catch(e=>alert('Copy failed:'+e));
}

function onDownloadPDF() {
  const loc = $('lang').value;
  const vh  = headingLabels[loc].verses;
  const ch  = headingLabels[loc].commentary;
  const tmp = document.createElement('div');

  tmp.style.padding    = '40px';
  tmp.style.background = 'white';
  tmp.style.color      = 'black';

  tmp.innerHTML = `
    <div style="text-align:center; margin-bottom:2rem;">
      <img src="/logo.png" style="max-width:200px; height:auto; margin:0 auto 1rem;"/>
    </div>
    <div style="text-align:center; margin-bottom:1rem; font-size:1.2em; line-height:1.1;">
      <strong>${labels[loc].tone}:</strong> ${$('tone').value} &nbsp;&nbsp;
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
  `;

  document.body.appendChild(tmp);
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit:'pt', format:'a4' });

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
}
