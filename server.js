const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Model configuration
const MODEL = process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022";

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Debug endpoint to get available models
app.get("/api/models", async (req, res) => {
  try {
    const r = await fetch("https://api.anthropic.com/v1/models", {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    });
    const j = await r.json();
    res.json(j.data.map(m => m.id));
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
        
        // \u05d1\u05e0\u05d9\u05d9\u05ea \u05d4\u05e0\u05d7\u05d9\u05d4 \u05d4\u05d7\u05d3\u05e9 \u05d5\u05d7\u05dbמ\u05d4 \u05d9ותר \u05dcק\u05dcוד
        const userPrompt = `You are an expert API analyst. Analyze the service at the domain "${domain}".
I have performed a real Google search to find its API documentation.

The most likely documentation URL I found is: ${documentationURL || "Not found."}
Here are some relevant snippets from the search results:
"${searchResultsText || "No snippets found."}"

Based on this REAL information, and your general knowledge, please fill in the following JSON structure.
- If you find a real Base URL or documentation link, use it.
- Prioritize information from the snippets.
- If you cannot find specific information, use the string "לא נמצא מידע". Do not invent false information.
- Provide the real service name.

Return ONLY the valid JSON object, with no other text or explanations.

JSON format:
{
  "serviceName": "שם השירות בעברית",
  "hasAPI": true,
  "apiType": "REST",
  "baseURL": "https://api.${domain}",
  "documentationURL": "${documentationURL || `https://${domain}/docs`}",
  "requiresAuth": true,
  "authType": "API Key",
  "keyEndpoints": ["/api/v1/data", "/api/v1/users"],
  "description": "תיאור קצר של השירות בעברית",
  "exampleRequest": "curl -H 'Authorization: Bearer TOKEN' https://api.${domain}/api/v1/data",
  "sdkAvailable": false,
  "rateLimits": "לא נמצא מידע",
  "pricingModel": "לא נמצא מידע",
  "sources": ["${documentationURL || domain}"]
}`;

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

        console.log("📤 model:", MODEL || "<hardcoded>");

        if (!anthropicResponse.ok) {
            const errorText = await anthropicResponse.text();
            console.error('Anthropic API error:', anthropicResponse.status, errorText);
            throw new Error(`Anthropic API error: ${anthropicResponse.status}`);
        }

        const data = await anthropicResponse.json();
        let apiInfo = data.content[0].text;
        
        // \u05e0\u05d9\u05e7\u05d5\u05d9 JSON
        apiInfo = apiInfo.replace(/\`\`\`json\s*/g, '').replace(/\`\`\`\s*/g, '').trim();
        
        try {
            const parsedResult = JSON.parse(apiInfo);
            // \u05d4\u05d5\u05e1\u05e4\u05ea \u05d4\u05de\u05e7\u05d5\u05e8 \u05d4\u05d0\u05de\u05d9\u05ea \u05d0\u05dd \u05e0\u05de\u05e6\u05d0
            if (documentationURL && parsedResult.sources) {
                 if (!parsedResult.sources.includes(documentationURL)) {
                    parsedResult.sources.unshift(documentationURL);
                }
            } else if (documentationURL) {
                 parsedResult.sources = [documentationURL];
            }
            res.json(parsedResult);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw response from Claude:', apiInfo);
            res.status(500).json({ error: '\u05e0\u05db\u05e9\u05dc \u05d1\u05e0\u05d9\u05ea\u05d5\u05d7 \u05d4\u05ea\u05d2\u05d5\u05d1\u05d4 \u05de\u05de\u05d5\u05d3\u05dc \u05d4\u05d1\u05d9\u05e0\u05d4 \u05d4\u05de\u05dc\u05d0\u05db\u05d5\u05ea.' });
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
