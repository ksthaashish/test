const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getCategoryFiles() {
  ensureDataDir();
  return fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => ({ file: f, category: path.basename(f, '.json') }));
}

function readCategory(category) {
  const file = path.join(DATA_DIR, `${category}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf8').trim();
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`  [ERROR] Failed to parse ${file}:`, e.message);
    return [];
  }
}

function writeCategory(category, data) {
  ensureDataDir();
  const file = path.join(DATA_DIR, `${category}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  [SAVED] ${file} (${data.length} entries)`);
}

function getAllKanji() {
  const cats = getCategoryFiles();
  const all = [];
  for (const { file, category } of cats) {
    console.log(`  [READ] data/${file}`);
    const entries = readCategory(category);
    for (const k of entries) all.push({ ...k, category });
  }
  return all;
}

function findKanjiLocation(character) {
  for (const { category } of getCategoryFiles()) {
    const entries = readCategory(category);
    const idx = entries.findIndex(k => k.character === character);
    if (idx !== -1) return { category, entries, idx };
  }
  return null;
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/kanji — return all kanji with category field
app.get('/api/kanji', (req, res) => {
  console.log('[GET] /api/kanji');
  const all = getAllKanji();
  console.log(`  => ${all.length} total kanji`);
  res.json(all);
});

// GET /api/categories — return list of category names
app.get('/api/categories', (req, res) => {
  const cats = getCategoryFiles().map(c => c.category);
  res.json(cats);
});

// POST /api/kanji — add new kanji
app.post('/api/kanji', (req, res) => {
  const kanji = req.body;
  const category = (kanji.category || 'user').toLowerCase().replace(/\s+/g, '_');
  console.log(`[POST] /api/kanji — character="${kanji.character}" category="${category}"`);

  if (!kanji.character || !kanji.meaning) {
    return res.status(400).json({ error: 'character and meaning are required' });
  }

  const entries = readCategory(category);
  const existing = entries.findIndex(k => k.character === kanji.character);
  if (existing !== -1) {
    return res.status(409).json({ error: `"${kanji.character}" already exists in ${category}` });
  }

  const { category: _c, ...data } = kanji;
  entries.push(data);
  writeCategory(category, entries);
  res.status(201).json({ ...data, category });
});

// PUT /api/kanji/:character — update existing kanji
app.put('/api/kanji/:character', (req, res) => {
  const char = decodeURIComponent(req.params.character);
  console.log(`[PUT] /api/kanji/${char}`);

  const location = findKanjiLocation(char);
  if (!location) {
    return res.status(404).json({ error: `"${char}" not found` });
  }

  const { category: newCat, ...updates } = req.body;
  const { category, entries, idx } = location;
  const targetCat = (newCat || category).toLowerCase().replace(/\s+/g, '_');

  if (targetCat !== category) {
    // Move to new category
    entries.splice(idx, 1);
    writeCategory(category, entries);
    const newEntries = readCategory(targetCat);
    newEntries.push(updates);
    writeCategory(targetCat, newEntries);
  } else {
    entries[idx] = { ...entries[idx], ...updates };
    writeCategory(category, entries);
  }

  res.json({ ...updates, category: targetCat });
});

// DELETE /api/kanji/:character — remove kanji
app.delete('/api/kanji/:character', (req, res) => {
  const char = decodeURIComponent(req.params.character);
  console.log(`[DELETE] /api/kanji/${char}`);

  const location = findKanjiLocation(char);
  if (!location) {
    return res.status(404).json({ error: `"${char}" not found` });
  }

  const { category, entries, idx } = location;
  entries.splice(idx, 1);
  writeCategory(category, entries);
  res.json({ ok: true, character: char, category });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n漢字 Kanji App running at http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}\n`);
});
