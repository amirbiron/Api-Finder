// ----- script.js (clean rescue) -----
const formEl    = document.querySelector("#analyze-form");
const inputEl   = document.querySelector("#url-input");
const resultEl  = document.querySelector("#result");
const loadingEl = document.querySelector("#loading");

formEl.addEventListener("submit", e => {
  e.preventDefault();
  const url = (inputEl.value || "").trim();
  if (!url) return alert("נא להזין כתובת");
  analyze(url);
});

async function analyze(url) {
  showLoading(true);
  clearResult();
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const raw = await res.text();

    if (!res.ok) {
      showError("Server error: " + res.status + "\n" + raw);
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      showError("JSON parse error: " + err.message + "\nRAW:\n" + raw.slice(0,1500));
      return;
    }

    // נרמול אנדפוינטים (אם הגיעו כאובייקטים)
    data.keyEndpoints = normalizeEndpoints(data.keyEndpoints);

    renderResult(data);
  } catch (err) {
    showError("Network/JS error: " + err.message);
  } finally {
    showLoading(false);
  }
}

function normalizeEndpoints(list) {
  if (!Array.isArray(list)) return [];
  return list.map(ep => {
    if (!ep) return null;
    if (typeof ep === "string") return ep;
    const m = (ep.method || "GET").toUpperCase();
    const p = ep.path || "";
    return `${m} ${p}`;
  }).filter(Boolean);
}

function renderResult(d) {
  // בנה HTML פשוט
  const html = `
    <section style="background:#fafafa;border:1px solid #ddd;border-radius:8px;padding:16px;">
      <h2 style="margin-top:0;">${escapeHtml(d.serviceName || "ללא שם")}</h2>
      ${row("יש API?", d.hasAPI ? "✅ כן" : "❌ לא")}
      ${row("סוג API", d.apiType)}
      ${row("Base URL", link(d.baseURL))}
      ${row("דוקומנטציה", link(d.documentationURL))}
      ${row("נדרש אימות", d.requiresAuth === undefined ? "" : (d.requiresAuth ? "כן" : "לא"))}
      ${row("סוג אימות", d.authType)}
      ${listRow("Endpoints עיקריים", d.keyEndpoints)}
      ${row("תיאור", d.description)}
      ${codeRow("דוגמת בקשה", d.exampleRequest)}
      ${linkListRow("מקורות", d.sources)}
    </section>
  `;
  resultEl.innerHTML = html;
}

function row(label, value) {
  if (!value) return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${value}</p>`;
}

function listRow(label, arr) {
  if (!arr || !arr.length) return "";
  return `<p><strong>${escapeHtml(label)}:</strong></p>
          <ul>${arr.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function codeRow(label, code) {
  if (!code) return "";
  return `<details><summary>${escapeHtml(label)}</summary><pre>${escapeHtml(code)}</pre></details>`;
}

function link(url) {
  if (!url) return "";
  return `<a href="${url}" target="_blank">${url}</a>`;
}

function linkListRow(label, arr) {
  if (!arr || !arr.length) return "";
  return `<p><strong>${escapeHtml(label)}:</strong></p>
          <ul>${arr.map(u => `<li>${link(u)}</li>`).join("")}</ul>`;
}

function showLoading(on) {
  loadingEl.style.display = on ? "block" : "none";
}

function clearResult() {
  resultEl.innerHTML = "";
}

function showError(txt) {
  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.background = "#fee";
  pre.style.color = "#900";
  pre.style.padding = "12px";
  pre.style.border = "1px solid #f99";
  pre.textContent = txt;
  resultEl.innerHTML = "";
  resultEl.appendChild(pre);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
// ----- end script.js -----
