const express = require('express');
const fetch = require('node-fetch'); // If using Node < 18, install node-fetch
require('dotenv').config();

const app = express();
app.use(express.json());

// POST /analyze expects JSON { url: string, websiteContent?: string }
app.post('/analyze', async (req, res) => {
  const { url, websiteContent = '' } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  const domain = new URL(url).hostname;

  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `אתה חוקר API מקצועי. עליך לחפש מידע אמיתי על האתר ${url}.

השתמש בכלי web_search שלך כדי לחפש:
1. "${domain} API documentation"
2. "${domain} developer guide"  
3. "${domain} API endpoints"
4. "${domain} API authentication"

${websiteContent ? `תוכן רלוונטי מהאתר: ${websiteContent}` : ''}

חפש ואסוף מידע אמיתי בלבד מהמקורות שמצאת. אם לא מוצא מידע מדויק על משהו - כתב "לא נמצא מידע" במקום להמציא.

החזר JSON עם:
- serviceName: שם השירות (בעברית אם אפשר)
- hasAPI: האם יש API אמיתי (true/false על בסיס מה שמצאת)
- apiType: סוג API אמיתי שמצאת או "לא נמצא מידע"
- baseURL: כתובת בסיס אמיתית שמצאת או null
- documentationURL: קישור אמיתי לדוקומנטציה שמצאת או null
- requiresAuth: האם נדרש authentication על בסיס המקורות או "לא נמצא מידע"
- authType: סוג authentication אמיתי שמצאת או "לא נמצא מידע"
- keyEndpoints: רשימת endpoints אמיתיים שמצאת או []
- description: תיאור מבוסס על המקורות שמצאת (בעברית)
- exampleRequest: דוגמה אמיתית מהדוקומנטציה או null
- sdkAvailable: האם יש SDK על בסיס מה שמצאת או "לא נמצא מידע"
- rateLimits: מגבלות אמיתיות שמצאת או "לא נמצא מידע"
- pricingModel: מודל תמחור אמיתי שמצאת או "לא נמצא מידע"
- sources: רשימת המקורות שממנם לקחת את המידע

חשוב: 
- חפש באינטרנט באמת ואל תמציא כלום!
- אם לא מוצא מידע - אמור שלא מצאת
- רק מידע שמופיע במקורות אמיתיים
- תן מקורות לכל מידע

החזר JSON תקין בלבד, ללא markdown או הסברים.`
          }
        ]
      })
    });

    const data = await anthropicResponse.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to analyze API' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});