const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/analyze', async (req, res) => {
    try {
        const { url, websiteContent } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL נדרש' });
        }

        const domain = new URL(url).hostname;

        // Import fetch for Node.js
        const fetch = (await import('node-fetch')).default;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.ANTHROPIC_API_KEY
            },
            body: JSON.stringify({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1500,
                messages: [
                    {
                        role: "user",
                        content: `אתה מומחה לזיהוי APIs. נתח את האתר ${url} (domain: ${domain}).

${websiteContent ? `תוכן מהאתר: ${websiteContent}` : ''}

בהתבסס על הדומיין, שם החברה, והתוכן - צור ניתוח של ה-API האפשרי.

אני רוצה שתחזיר JSON בפורמט הזה בלבד:

{
  "serviceName": "שם השירות בעברית",
  "hasAPI": true,
  "apiType": "REST",
  "baseURL": "https://api.${domain}",
  "documentationURL": "https://${domain}/docs",
  "requiresAuth": true,
  "authType": "API Key",
  "keyEndpoints": ["/api/v1/data", "/api/v1/users"],
  "description": "תיאור קצר של השירות בעברית",
  "exampleRequest": "curl -H 'Authorization: Bearer TOKEN' https://api.${domain}/api/v1/data",
  "sdkAvailable": true,
  "rateLimits": "1000 בקשות לשעה",
  "pricingModel": "freemium",
  "sources": ["${domain}"]
}

התבסס על ידע כללי ועל הדומיין. החזר רק JSON תקין ללא הסברים.`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Anthropic API error:', response.status, errorText);
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        let apiInfo = data.content[0].text;
        
        // ניקוי JSON
        apiInfo = apiInfo.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        try {
            const parsedResult = JSON.parse(apiInfo);
            res.json(parsedResult);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Raw response:', apiInfo);
            
            // Fallback response
            res.json({
                serviceName: domain.replace(/\./g, ' '),
                hasAPI: true,
                apiType: "REST",
                baseURL: `https://api.${domain}`,
                documentationURL: `https://${domain}/docs`,
                requiresAuth: true,
                authType: "API Key",
                keyEndpoints: ["/api/v1/data", "/api/v1/users"],
                description: `שירות API של ${domain}`,
                exampleRequest: `curl -H 'Authorization: Bearer TOKEN' https://api.${domain}/api/v1/data`,
                sdkAvailable: true,
                rateLimits: "1000 בקשות לשעה",
                pricingModel: "freemium",
                sources: [domain],
                note: "ניתוח בסיסי מבוסס דומיין"
            });
        }
        
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: `שגיאה בשרת: ${error.message}` 
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
