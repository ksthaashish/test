// ── API helpers ──────────────────────────────────────────────────────────────
const api = {
  async get(url)           { const r = await fetch(url); if (!r.ok) throw await r.json(); return r.json(); },
  async post(url, body)    { const r = await fetch(url, { method:'POST',   headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); if (!r.ok) throw await r.json(); return r.json(); },
  async put(url, body)     { const r = await fetch(url, { method:'PUT',    headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); if (!r.ok) throw await r.json(); return r.json(); },
  async delete(url)        { const r = await fetch(url, { method:'DELETE' }); if (!r.ok) throw await r.json(); return r.json(); },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const c = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div'); el.id = 'toast-container'; document.body.appendChild(el); return el;
  })();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── Badge helper ──────────────────────────────────────────────────────────────
function badgeClass(cat) {
  const map = { n5:'badge-n5', n4:'badge-n4', n3:'badge-n3', n2:'badge-n2', n1:'badge-n1', user:'badge-user' };
  return 'badge ' + (map[cat?.toLowerCase()] || 'badge-default');
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function initTabs(containerSel) {
  const container = document.querySelector(containerSel);
  if (!container) return;
  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab)?.classList.add('active');
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// ── Active nav link ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('nav.site-nav a').forEach(a => {
    const href = a.getAttribute('href').replace(/\/$/, '') || '/';
    if (path === href || (href !== '/' && path.startsWith(href))) a.classList.add('active');
  });
  document.getElementById('toast-container') || (() => {
    const el = document.createElement('div'); el.id = 'toast-container'; document.body.appendChild(el);
  })();
});
