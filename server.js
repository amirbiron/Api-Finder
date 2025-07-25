const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Model configuration
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";
console.log("📤 Claude model:", `[${MODEL}]`);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get("/api/models", async (req, res) => {
  try {
    const r = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    });
    const j = await r.json();
    // נחזיר רק את ה-id-ים כדי שיהיה נקי
    res.json(j.data?.map(m => m.id) || []);
  } catch (e) {
    console.error("Models fetch error:", e);
    res.status(500).json({ error: "Failed to fetch models" });
  }
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL נדרש' });
        }

        const domain = new URL(url).hostname;

        // --- שלב 1: חיפוש אמיתי בגוגל כדי למצוא את דף התיעוד ---
        const googleApiKey = process.env.GOOGLE_SEARCH_API_KEY;
        const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
        const searchQuery = `${domain} API documentation developer`;

        if (!googleApiKey || !searchEngineId) {
            throw new Error('\u05de\u05e4\u05ea\u05d7 \u05d4-API \u05e9\u05dc \u05d2\u05d5\u05d2\u05dc \u05d0\u05d5 \u05de\u05d6\u05d4\u05d4 \u05de\u05e0\u05d5\u05e2 \u05d4\u05d7\u05d9\u05e4\u05d5\u05e9 \u05d0\u05d9\u05e0\u05dd \u05de\u05d5\u05d2\u05d3\u05e8\u05d9\u05dd \u05d1\u05e9\u05e8\u05ea.');
        }

        const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(searchQuery)}`;

        let documentationURL = '';
        let searchResultsText = '';

        try {
            const searchResponse = await fetch(googleSearchUrl);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                if (searchData.items && searchData.items.length > 0) {
                    // \u05e7\u05d7 \u05d0\u05ea \u05d4\u05ea\u05d5\u05e6\u05d0 \u05d4\u05e8\u05d0\u05e9\u05d5\u05e0\u05d9\u05ea \u05d1\u05d9\u05d5\u05ea\u05e8
                    documentationURL = searchData.items[0].link;
                    // \u05d0\u05d9\u05e1\u05d5\u05e3 \u05ea\u05d9\u05d0\u05d5\u05e8\u05d9\u05dd (snippets) \u05de\u05d4\u05ea\u05d5\u05e6\u05d0\u05d5\u05ea \u05d4\u05e8\u05d0\u05e9\u05d5\u05e0\u05d5\u05ea \u05db\u05d3\u05d9 \u05dc\u05ea\u05ea \u05dc\u05e7\u05dc\u05d5\u05d3 \u05d9\u05d5\u05ea\u05e8 \u05d4\u05e7\u05e9\u05e8
                    searchResultsText = searchData.items.slice(0, 3).map(item => item.snippet).join('\n');
                }
            }
        } catch (searchError) {
            console.error('\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05d7\u05d9\u05e4\u05d5\u05e9 \u05d1\u05d2\u05d5\u05d2\u05dc, \u05de\u05de\u05e9\u05d9\u05da \u05d1\u05dc\u05e2\u05d3\u05d9\u05d5: ', searchError);
            // \u05d0\u05dd \u05d4\u05d7\u05d9\u05e4\u05d5\u05e9 \u05e0\u05db\u05e9\u05dc, \u05e0\u05de\u05e9\u05d9\u05da \u05d4\u05d0\u05dc\u05d4 \u05d5\u05e0\u05e2\u05de\u05d3 \u05e2\u05dc \u05d4\u05d9\u05d3\u05e2 \u05e9\u05dc \u05e7\u05dc\u05d5\u05d3
        }


        // --- שלב 2: שליחת המידע האמיתי לקלוד לניתוח ---
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
            throw new Error('\u05de\u05e4\u05ea\u05d7 \u05d4-API \u05e9\u05dc Anthropic \u05d0\u05d9\u05e0\u05d5 \u05de\u05d5\u05d2\u05d3\u05e8 \u05d1\u05e9\u05e8\u05ea.');
        }
        
        // עדכון הפרומפט החדש
        const userPrompt = `You are an expert API analyst. Analyze the service at the domain "${domain}".
I performed a REAL Google search to find its API documentation.

Most likely documentation URL: ${documentationURL || "Not found."}
Snippets from search results:
"${searchResultsText || "No snippets found."}"

Instructions:
- Do NOT repeat the same value in multiple fields.
- If a field is unknown, either omit it or use the string "לא נמצא מידע" once (max one appearance in the entire JSON).
- Only list endpoints you are reasonably sure exist. Otherwise, leave the array empty.
- Prefer data from the snippets or the detected documentationURL over your general knowledge.
- Return ONLY a valid JSON object. No backticks, no extra text.
- Return keyEndpoints as objects with method and path.
- Use POST for completions/responses; GET רק למודלים/קבצים וכו'.

JSON format:
{
  "serviceName": "שם השירות בעברית",
  "hasAPI": true,
  "apiType": "REST",
  "baseURL": "https://api.${domain}",
  "documentationURL": "${documentationURL || `https://${domain}/docs`}",
  "requiresAuth": true,
  "authType": "API Key",
  "keyEndpoints": [{"method": "GET", "path": "/api/v1/data"}, {"method": "POST", "path": "/api/v1/users"}],
  "description": "תיאור קצר של השירות בעברית",
  "exampleRequest": "curl -H 'Authorization: Bearer TOKEN' https://api.${domain}/api/v1/data",
  "sdkAvailable": false,
  "rateLimits": "לא נמצא מידע",
  "pricingModel": "לא נמצא מידע",
  "sources": ["${documentationURL || domain}"]
}`;

        console.log("📤 Claude model:", MODEL);

        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": anthropicApiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 2048,
                messages: [{ role: "user", content: userPrompt }]
            })
        });

        if (!anthropicResponse.ok) {
            const errorText = await anthropicResponse.text();
            console.error('Anthropic API error:', anthropicResponse.status, errorText);
            throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
        }

        const data = await anthropicResponse.json();
        let apiInfo = data.content[0].text;
        
        // \u05e0\u05d9\u05e7\u05d5\u05d9 JSON
        apiInfo = apiInfo.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
        
        let parsedResult;
        try {
            parsedResult = JSON.parse(apiInfo);
            
            if (domain === "api.openai.com") {
              const fixMethod = ep => {
                if (!ep) return ep;
                if (typeof ep === "string") {
                  const guess = { method: "GET", path: ep };
                  if (/\/v1\/(chat\/)?completions|\/v1\/responses/.test(ep)) guess.method = "POST";
                  return guess;
                }
                if (ep.path && /\/v1\/(chat\/)?completions|\/v1\/responses/.test(ep.path)) ep.method = "POST";
                return ep;
                };
              parsedResult.keyEndpoints = (parsedResult.keyEndpoints || []).map(fixMethod);
              if (!parsedResult.keyEndpoints.length) {
                parsedResult.keyEndpoints = [
                  { method: "POST", path: "/v1/responses" },
                  { method: "POST", path: "/v1/chat/completions" },
                  { method: "POST", path: "/v1/completions" },
                  { method: "GET",  path: "/v1/models" }
                ];
              }
            }
            
            // ניקוי כפילויות ושדות ריקים
            const dedupe = arr => Array.isArray(arr) ? [...new Set(arr.filter(Boolean))] : [];

            // איחוד/ניקוי מערכים
            parsedResult.keyEndpoints = dedupe(parsedResult.keyEndpoints);
            parsedResult.sources = dedupe(parsedResult.sources);

            // מחיקה אם השדה הוא "לא נמצא מידע" וגם ריק/לא שימושי
            for (const k of Object.keys(parsedResult)) {
                if (parsedResult[k] === "לא נמצא מידע" || parsedResult[k] === "" || parsedResult[k] === null) {
                    // השאר "לא נמצא מידע" רק פעם אחת בכל האובייקט
                    // מצא אם כבר יש "לא נמצא מידע" בערך אחר
                    const alreadyUsed = Object.values(parsedResult).some(v => v === "לא נמצא מידע");
                    if (alreadyUsed) delete parsedResult[k];
                }
            }
            
            // ברירות מחדל חכמות לדומיינים מוכרים
            if (domain === "api.openai.com") {
                parsedResult.baseURL = parsedResult.baseURL || "https://api.openai.com/v1";
                parsedResult.documentationURL = parsedResult.documentationURL || "https://platform.openai.com/docs/api-reference";
                parsedResult.keyEndpoints = parsedResult.keyEndpoints?.length ? parsedResult.keyEndpoints : ["/v1/models", "/v1/chat/completions"];
            }
            // אפשר להוסיף כאן דומיינים נוספים לפי הצורך
            
            // \u05d4\u05d5\u05e1\u05e4\u05ea \u05d4\u05de\u05e7\u05d5\u05e8 \u05d4\u05d0\u05de\u05d9\u05ea \u05d0\u05dd \u05e0\u05de\u05e6\u05d0
            if (documentationURL && parsedResult.sources) {
                 if (!parsedResult.sources.includes(documentationURL)) {
                    parsedResult.sources.unshift(documentationURL);
                }
            } else if (documentationURL) {
                 parsedResult.sources = [documentationURL];
            }
            res.json(parsedResult);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return res.status(502).json({
                error: "JSON_PARSE_ERROR",
                message: e.message,
                raw: apiInfo.slice(0,1500)
            });
        }
        
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: `\u05e9\u05d2\u05d9\u05d0\u05d4 \u05d1\u05e9\u05e8\u05ea: ${error.message}` 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
