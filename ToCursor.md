אמרת לי לשלוח לך את זה כדי לתקן את השגיאות של הסיקורטי סקאן החודשי:
אולי תעיין קודם בקובץ "auto-updates-and-auto-merge.md" שבDocs.

- עדכון דוח הסריקה  
- לכותרת “Trivy Image python:3.11-alpine” להחליף תמורת דינמית (app:scan).  
- להשוות CodeQL / Trivy FS / Trivy Image כדי לראות תמונה של כל מקור  

📌 מציאות CVEs בתמונה (Image)  
- חבילות פיתוח שלא נדרשות ב-production להחסיר מהן: cairo, pango, gdk-pixbuf, fontconfig, font-dejavu.  
- חבילות build-time בלבד: tzdata, curl, libxml2, sqlite-libs, zlib (לעשות הדקות ב-Alpine 3.20/3.21).  
- שקול מעבר לסריקות מבוססות בסיס פתוח (ChainGuard/Wolfi) למניעת חבילות מיותרות.  

📌 מציאות CVEs ב־pip  
- שדרג/תחליף חבילות פגיעות, ולעדכן constraints.  
- לשלב pip-audit ב־CI.  

📌 השחתת Build  
- הימנע מחבילות gcc(+g++/musl-dev/headers) כשלא דרוש ב־production.  
- תן ל־builder או ל־stages שונים להכיל.  
- השתמש בספריות include/build רק בצעד build-runtime.  

📌 מושלמת Ignore מדיניות  
- אין תיקון רק למקרים מוצדקים מתועדים, ליצור upstream (סיכון נמוך/סיכון מנוהל).  

📌 מדידה וויג'ינג  
- baseline (CRITICAL/HIGH/...) לשמור.  
- למשל *לא לעלות ב־CI* להוסיף ספי כשל רכים/קשים על non-CRITICAL.  

מה אתה ממליץ לשלוח לי מסקנות לזה:  

- לגמרי, זה אפשרי באותה דרך להחסיר החבילות ה־non-production?  
- אם כן, נסה ChainGuard/Wolfi לאפשר מעבר לדימויים בסיס.  
- הוכח (או תעדכן את הקונפיגים) ל־Trivy FS/CodeQL פלט מלא של כל מקור.