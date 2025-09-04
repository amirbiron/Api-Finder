# Claude Code Integration

פרויקט דמו להדגמת שימוש בכלי Claude Code באמצעות GitHub Actions. הפרויקט מאפשר הפעלת Claude Code באמצעות תגים במערכת Issues ו-Pull Requests של GitHub.

## תיאור הפרויקט

פרויקט זה מדגים כיצד להגדיר ולהשתמש ב-Claude Code - כלי AI מתקדם לעבודה עם קוד. Claude Code מאפשר לבצע פעולות שונות על הקוד שלכם באמצעות בקשות בשפה טבעית.

## התקנה והרצה

### דרישות מוקדמות
- חשבון GitHub עם הרשאות לניהול Actions
- מפתח API של Anthropic (ANTHROPIC_API_KEY)

### שלבי ההתקנה

1. **העתקת קבצי התצורה**
   ```bash
   # העתק את קובץ ה-workflow לפרויקט שלך
   cp .github/workflows/claude.yml /path/to/your/project/.github/workflows/
   ```

2. **הגדרת משתני הסביבה**
   - עבור לעמוד Settings של הריפו ב-GitHub
   - בחר Secrets and variables → Actions
   - הוסף secret חדש בשם `ANTHROPIC_API_KEY` עם מפתח ה-API שלך

3. **הגדרת הרשאות**
   ודא שב-workflow יש את ההרשאות הבאות:
   - `id-token: write`
   - `contents: write` 
   - `issues: write`
   - `pull-requests: write`

### הפעלה

לאחר ההתקנה, Claude Code יפעל אוטומטית בתגובה לאירועים הבאים:
- תגובות חדשות ב-Issues (עם תג `@claude`)
- תגובות חדשות ב-Pull Requests (עם תג `@claude`)
- הפעלה ידנית מטאב Actions

## דוגמאות שימוש

### שימוש בסיסי
```
@claude סכם את הקבצים בריפו
```

### דוגמאות מתקדמות
```
@claude בדוק את הקוד לבאגים אבטחה
@claude כתוב unit tests לפונקציה xyz
@claude שפר את הביצועים של קובץ Y
@claude צור documentation לפרויקט
@claude הצע שיפורים לקובץ X
```

### טריגרים פעילים
- `issue_comment` (created) - תגובות ב-Issues
- `pull_request_review_comment` (created) - תגובות ב-Pull Requests  
- `workflow_dispatch` - הפעלה ידנית מטאב Actions

## רישיון

MIT License

Copyright (c) 2025 Claude Code Integration Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.