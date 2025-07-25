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

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ANTHROPIC_API_KEY}`
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2000,
                messages: [
                    {
                        role: "user",
                        content: `חפש באינטרנט מידע אמיתי על האתר ${url} (domain: ${domain}).

השתמש בכלי web_search שלך וחפש באמת:
1. "${domain} API documentation"
2. "${domain} API endpoints" 
3. "${domain} developer docs"

${websiteContent ? `תוכן רלוונטי מהאתר: ${websiteContent}` : ''}

אסוף רק מידע אמיתי ומדויק מהמקורות שמצאת. אם לא מוצא מידע - כתוב "לא נמצא מידע".

החזר JSON עם:
{
  "serviceName": "שם השירות בעברית",
  "hasAPI": true/false על בסיס המקורות,
  "apiType": "REST/GraphQL מהמקורות או לא נמצא מידע",
  "baseURL": "כתובת אמיתית או null",
  "documentationURL": "קישור אמיתי או null",
  "requiresAuth": true/false מהמקורות,
  "authType": "סוג אמיתי או לא נמצא מידע",
  "keyEndpoints": ["endpoints אמיתיים"],
  "description": "תיאור בעברית מהמקורות",
  "exampleRequest": "דוגמה אמיתית או null",
  "sdkAvailable": true/false מהמקורות,
  "rateLimits": "מגבלות אמיתיות בעברית או לא נמצא מידע",
  "pricingModel": "תמחור אמיתי בעברית או לא נמצא מידע",
  "sources": ["מקורות אמיתיים"]
}

חיוני: חפש באמת ואל תמציא! רק מידע ממקורות אמיתיים!`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status}`);
        }

        const data = await response.json();
        let apiInfo = data.content[0].text;
        apiInfo = apiInfo.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        
        try {
            const parsedResult = JSON.parse(apiInfo);
            res.json(parsedResult);
        } catch (parseError) {
            const jsonMatch = apiInfo.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const extractedJson = JSON.parse(jsonMatch[0]);
                    res.json(extractedJson);
                } catch (extractError) {
                    res.json({
                        serviceName: domain,
                        description: apiInfo,
                        hasAPI: true,
                        error: 'לא ניתן לפרסר את התוצאה'
                    });
                }
            } else {
                res.json({
                    serviceName: domain,
                    description: apiInfo,
                    hasAPI: true,
                    error: 'התוצאה התקבלה בפורמט טקסט'
                });
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: `שגיאה בשרת: ${error.message}` 
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
