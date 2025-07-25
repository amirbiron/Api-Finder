/* ---------- script.js (final clean version) ---------- */

// DEBUG mode via URL: add ?debug=1
const DEBUG = new URLSearchParams(location.search).has("debug");

// Elements (שנה IDs אם שונים אצלך)
const formEl     = document.querySelector("#analyze-form");
const inputEl    = document.querySelector("#url-input");
const resultEl   = document.querySelector("#result");       // כאן נרנדר את התוצאה
const spinnerEl  = document.querySelector("#loading");      // אופציונלי: דיב עם ספינר

// Attach listeners
if (formEl) {
  formEl.addEventListener("submit", ev => {
    ev.preventDefault();
    const url = (inputEl?.value || "").trim();
    if (!url) return notify("נא להזין כתובת URL");
    analyze(url);
  });
}

// Main analyze function
async function analyze(url) {
  showSpinner(true);
  clearResult();

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    const raw = await res.text();

    if (!res.ok) {
      console.error("Server error:", res.status, raw);
      alert("שגיאה בשרת (ראה קונסול)");
      return;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse error:", e, raw);
      alert("JSON שבור מהשרת (ראה קונסול)");
      return;
    }

    // נרמול אנדפוינטים למקרה שקיבלנו אובייקטים:
    data.keyEndpoints = normalizeEndpoints(data.keyEndpoints);

    renderResult(data);
    if (DEBUG) debugBox(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Network/JS error:", e);
    alert("שגיאת רשת/JS – בדוק קונסול.");
  } finally {
    showSpinner(false);
  }
}

/* ---------- Helpers ---------- */

// מציג הודעה קצרה למשתמש (תוכל להחליף ל-toast שלך)
function notify(msg) {
  alert(msg);
}

// מנקה תוצאה קודמת
function clearResult() {
  if (resultEl) resultEl.innerHTML = "";
}

// ספינר (אם אין לך – פשוט השאר ריק)
function showSpinner(on) {
  if (!spinnerEl) return;
  spinnerEl.style.display = on ? "block" : "none";
}

// דיבוג חכם – לא מוחק את ה-UI
function debugBox(text) {
  if (!DEBUG) return;
  let box = document.getElementById("debug-box");
  if (!box) {
    box = document.createElement("pre");
    box.id = "debug-box";
    box.style.position = "fixed";
    box.style.bottom = "0";
    box.style.left = "0";
    box.style.width = "100%";
    box.style.maxHeight = "40vh";
    box.style.overflow = "auto";
    box.style.margin = "0";
    box.style.padding = "12px";
    box.style.background = "#111";
    box.style.color = "#0f0";
    box.style.fontSize = "12px";
    box.style.zIndex = "9999";
    box.style.whiteSpace = "pre-wrap";
    box.style.direction = "ltr";
    box.onclick = () => box.remove(); // לחץ כדי לסגור
    document.body.appendChild(box);
  }
  box.textContent = text;
}

// ממיר כל endpoint למחרוזת "METHOD PATH"
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

// רנדר תוצאה למסך
function renderResult(data) {
  if (!resultEl) return;

  // בנה HTML (פשוט, RTL). תעדכן סגנון/מבנה כרצונך:
  const html = `
    <div class="card">
      <h2>${escapeHtml(data.serviceName || "שירות ללא שם")}</h2>
      <p><strong>יש API?</strong> ${data.hasAPI ? "✅ כן" : "❌ לא"}</p>
      ${data.apiType ? `<p><strong>סוג API:</strong> ${escapeHtml(data.apiType)}</p>` : ""}
      ${data.baseURL ? `<p><strong>Base URL:</strong> <a href="${data.baseURL}" target="_blank">${data.baseURL}</a></p>` : ""}
      ${data.documentationURL ? `<p><strong>דוקומנטציה:</strong> <a href="${data.documentationURL}" target="_blank">${data.documentationURL}</a></p>` : ""}
      ${data.requiresAuth !== undefined ? `<p><strong>נדרש אימות:</strong> ${data.requiresAuth ? "כן" : "לא"}</p>` : ""}
      ${data.authType ? `<p><strong>סוג אימות:</strong> ${escapeHtml(data.authType)}</p>` : ""}

      ${renderEndpoints(data.keyEndpoints)}
      ${data.description ? `<p><strong>תיאור:</strong> ${escapeHtml(data.description)}</p>` : ""}

      ${data.exampleRequest ? `
        <details>
          <summary>דוגמת בקשה</summary>
          <pre>${escapeHtml(data.exampleRequest)}</pre>
        </details>` : ""}

      ${Array.isArray(data.sources) && data.sources.length ? `
        <p><strong>מקורות:</strong></p>
        <ul>${data.sources.map(s => `<li><a href="${s}" target="_blank">${s}</a></li>`).join("")}</ul>
      ` : ""}
    </div>
  `;

  resultEl.innerHTML = html;
}

// רנדר רשימת אנדפוינטים
function renderEndpoints(list) {
  if (!list || !list.length) return "";
  return `
    <p><strong>Endpoints עיקריים:</strong></p>
    <ul>
      ${list.map(ep => `<li>${escapeHtml(ep)}</li>`).join("")}
    </ul>
  `;
}

// מונע XSS פשוט
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------- done ---------- */
