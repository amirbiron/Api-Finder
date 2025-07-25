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

        // Import fetch for Node.js < 18
        const fetch = (await import('node-fetch')).default;

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
                        content: `נתח את האתר ${url} (domain: ${domain}) ותחזיר מידע על ה-API שלו.

${websiteContent ? `תוכן רלוונטי מהאתר: ${websiteContent}` : ''}

בהתבסס על הדומיין והתוכן, נתח ותחזיר JSON עם השדות הבאים:

{
  "serviceName": "שם השירות בעברית",
  "hasAPI": true/false (בהתבסס על הדומיין),
  "apiType": "REST",
  "baseURL": "כתובת API משוערת",
  "documentationURL": "קישור לדוקומנטציה משוער",
  "requiresAuth": true,
  "authType": "API Key",
  "keyEndpoints": ["endpoints נפוצים לסוג השירות"],
  "description": "תיאור השירות בעברית",
  "exampleRequest": "דוגמת curl",
  "sdkAvailable": true/false,
  "rateLimits": "מגבלות טיפוסיות",
  "pricingModel": "מודל תמחור משוער",
  "sources": ["${domain}"]
}

החזר JSON תקין בלבד.`
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
