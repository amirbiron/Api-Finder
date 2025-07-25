// Test script to verify endpoint formatting fixes
const express = require('express');

// Import the normalizeEndpoints function from server.js
function normalizeEndpoints(list, baseURL = "") {
  if (!Array.isArray(list)) return [];
  const base = (baseURL || "").replace(/\/$/, "");
  const METHODS = ["GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"];
  const RE_ANY   = new RegExp(`\\b(${METHODS.join("|")})\\b`, "gi");
  // שיפור הרגקס לזיהוי טוב יותר של methods דבוקים
  const RE_TIGHT = new RegExp(`(https?:\\/\\/[^\\s]+?)\\s*(${METHODS.join("|")})`, "gi");
  // רגקס נוסף לזיהוי methods דבוקים בתחילת מחרוזת
  const RE_METHODS_STUCK = new RegExp(`(${METHODS.join("|")})(${METHODS.join("|")})`, "gi");

  return list
    .map(ep => {
      if (!ep) return null;

      // כבר אובייקט?
      if (typeof ep === "object") {
        const method = (ep.method || "GET").toUpperCase();
        let path = (ep.path || "").trim();
        path = path.startsWith("/") ? path : "/" + path;
        return { method, path };
      }

      // מחרוזת
      let s = ep.replace(/\s+/g, " ").trim();

      // הפרדה אם דבוק: ...comPOST או GETPOST
      s = s.replace(RE_TIGHT, "$1 $2");
      s = s.replace(RE_METHODS_STUCK, "$1 $2");

      // חילוץ method ראשון
      const mMatch = s.match(RE_ANY);
      const method = (mMatch ? mMatch[0] : "GET").toUpperCase();
      s = s.replace(RE_ANY, "").trim();

      // הסרת baseURL
      if (base && s.startsWith(base)) s = s.slice(base.length);

      // חילוץ pathname אם נשאר URL מלא
      if (/^https?:\/\//i.test(s)) {
        try { s = new URL(s).pathname; } catch (_) {}
      }

      const path = s.startsWith("/") ? s : "/" + s;
      return { method, path };
    })
    .filter(Boolean);
}

// Test cases
console.log("🧪 Testing endpoint formatting fixes...\n");

// Test 1: Stuck methods (GETPOST)
console.log("Test 1: Stuck methods");
const stuckMethods = ["GETPOST/api/test", "GET/api/modelsGET/api/chat"];
const result1 = normalizeEndpoints(stuckMethods);
console.log("Input:", stuckMethods);
console.log("Output:", result1);
console.log("✅ Should separate GET and POST\n");

// Test 2: Objects with method and path
console.log("Test 2: Object endpoints");
const objectEndpoints = [
  { method: "GET", path: "/api/models" },
  { method: "POST", path: "/api/chat/completions" }
];
const result2 = normalizeEndpoints(objectEndpoints);
console.log("Input:", objectEndpoints);
console.log("Output:", result2);
console.log("✅ Should maintain object structure\n");

// Test 3: Mixed formats
console.log("Test 3: Mixed formats");
const mixedEndpoints = [
  "GET /api/models",
  "POST/api/chat",
  { method: "DELETE", path: "/api/users" },
  "https://api.example.comPOST/api/data"
];
const result3 = normalizeEndpoints(mixedEndpoints, "https://api.example.com");
console.log("Input:", mixedEndpoints);
console.log("Output:", result3);
console.log("✅ Should handle mixed formats correctly\n");

// Test 4: OpenAI default endpoints
console.log("Test 4: OpenAI default endpoints");
const openaiEndpoints = [
  { method: "GET", path: "/v1/models" }, 
  { method: "POST", path: "/v1/chat/completions" }
];
const result4 = normalizeEndpoints(openaiEndpoints);
console.log("Input:", openaiEndpoints);
console.log("Output:", result4);
console.log("✅ Should maintain proper OpenAI endpoint structure\n");

console.log("🎉 All tests completed! Check the output above to verify endpoints are properly formatted.");