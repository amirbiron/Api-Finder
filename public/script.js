const { useState } = React;

// פונקציה להצגת טקסט גולמי על המסך
function showRaw(text) {
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
    box.style.pointerEvents = "auto";
    document.body.appendChild(box);
  }
  box.textContent = text;
}

// Lucide Icons as SVG components
const Search = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="21 21l-4.35-4.35"></path>
    </svg>
);

const Globe = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
);

const Loader2 = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
        <path d="M21 12a9 9 0 11-6.219-8.56"></path>
    </svg>
);

const AlertCircle = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
);

const CheckCircle = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22,4 12,14.01 9,11.01"></polyline>
    </svg>
);

const Code = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16,18 22,12 16,6"></polyline>
        <polyline points="8,6 2,12 8,18"></polyline>
    </svg>
);

const FileText = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
    </svg>
);

const Copy = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
);

const RotateCcw = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="1,4 1,10 7,10"></polyline>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
    </svg>
);

const APIDetectorBot = () => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const copyResults = () => {
        if (result) {
            const textToCopy = JSON.stringify(result, null, 2);
            navigator.clipboard.writeText(textToCopy);
            alert('התוצאות הועתקו ללוח!');
        }
    };

    const resetForm = () => {
        setResult(null);
        setError('');
        setUrl('');
    };

    async function analyze(url) {
        try {
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
            });

            if (!res.ok) {
                const txt = await res.text();
                showRaw("Server error (" + res.status + "):\n\n" + txt);
                return;
            }

            const rawText = await res.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                showRaw("JSON parse error: " + e.message + "\n\nRAW:\n" + rawText.slice(0,2000));
                return;
            }

            // הצגת התוצאות דרך React state
            setResult(data);
        } catch (e) {
            showRaw("Network/JS error: " + e.message);
        }
    }

    const analyzeAPI = async () => {
        if (!url.trim()) {
            setError('נא להזין URL תקין');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const domain = new URL(url).hostname;
            
            // שלב 1: קבלת תוכן האתר דרך CORS proxy
            let websiteContent = '';
            try {
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const siteResponse = await fetch(proxyUrl);
                if (siteResponse.ok) {
                    const html = await siteResponse.text();
                    // חילוץ טקסט רלוונטי מה-HTML
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    
                    // חיפוש מילות מפתח API רלוונטיות
                    const textContent = doc.body?.textContent || '';
                    const apiKeywords = ['api', 'developer', 'documentation', 'endpoint', 'REST', 'GraphQL', 'token', 'key'];
                    const relevantSentences = textContent.split('.').filter(sentence => 
                        apiKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
                    ).slice(0, 10).join('. ');
                    
                    websiteContent = relevantSentences;
                }
            } catch (proxyError) {
                console.log('לא ניתן לקרוא את האתר ישירות, ממשיך ללא תוכן');
            }
            
            // שלב 2: ניתוח עם Claude - חיפוש אמיתי
            const response = await fetch("/api/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    url: url,
                    websiteContent: websiteContent
                })
            });

            if (!response.ok) {
                const txt = await response.text();
                showRaw("Server error (" + response.status + "):\n\n" + txt);
                throw new Error(`שגיאה ב-API: ${response.status}`);
            }

            const rawText = await response.text();
            let data;
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                showRaw("JSON parse error: " + e.message + "\n\nRAW:\n" + rawText.slice(0,2000));
                throw new Error("JSON parse error: " + e.message);
            }

            setResult(data);
            
        } catch (err) {
            showRaw("Network/JS error: " + err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateCodeExample = (result) => {
        if (!result?.baseURL || !result?.keyEndpoints?.length) return '';
        
        const endpoint = result.keyEndpoints[0];
        const endpointPath = typeof endpoint === "string" ? 
            (endpoint.includes(' ') ? endpoint.split(' ')[1] : endpoint) : 
            endpoint.path;
        const method = typeof endpoint === "string" ? 
            (endpoint.includes(' ') ? endpoint.split(' ')[0] : "GET") : 
            endpoint.method;
        const authHeader = result.requiresAuth ? 
            (result.authType === 'API Key' ? `'Authorization': 'Bearer YOUR_API_KEY'` : `'Authorization': 'Bearer YOUR_TOKEN'`) : '';
        
        return `// דוגמה לשימוש ב-JavaScript
fetch('${result.baseURL}${endpointPath}', {
  method: '${method}',
  headers: {
    'Content-Type': 'application/json',${authHeader ? '\n    ' + authHeader : ''}
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                        🤖 בוט זיהוי API
                    </h1>
                    <p className="text-base sm:text-lg text-gray-600 mb-4">
                        גלה מידע טכני על כל API תוך שניות עם חיפוש אמיתי ברשת
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-2xl mx-auto">
                        <p className="text-blue-800 text-xs sm:text-sm">
                            💡 <strong>טיפ:</strong> הזן כתובת של אתר או שירות ותקבל ניתוח מפורט של ה-API שלו - endpoints, authentication, דוקומנטציה ועוד
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 mb-6">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Globe className="inline w-4 h-4 mr-2" />
                                URL של האתר או השירות
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="https://api.example.com"
                                    onKeyPress={(e) => e.key === 'Enter' && analyze(url)}
                                />
                                <button
                                    onClick={() => analyze(url)}
                                    disabled={loading}
                                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <Loader2 />
                                    ) : (
                                        <Search />
                                    )}
                                    נתח
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-6">
                        <div className="flex items-center gap-2 text-red-800">
                            <AlertCircle />
                            <span className="text-sm break-words">{error}</span>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8 border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                            <CheckCircle className="text-green-500 flex-shrink-0" />
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                    {result.serviceName || 'שירות זוהה'}
                                </h2>
                                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                                    ✨ ניתוח API הושלם • {result.hasAPI ? 'API זוהה' : 'לא נמצא API'} • 
                                    מידע מבוסס על חיפוש אמיתי ברשת
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-4">
                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">📋 פרטי כלליים</h3>
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div><strong>יש API:</strong> {result.hasAPI ? '✅ כן' : '❌ לא'}</div>
                                        {result.apiType && result.apiType !== 'לא נמצא מידע' && <div><strong>📡 סוג API:</strong> {result.apiType}</div>}
                                        {result.description && <div><strong>📝 תיאור:</strong> <span className="break-words">{result.description}</span></div>}
                                        {result.pricingModel && result.pricingModel !== 'לא נמצא מידע' && <div><strong>💰 תמחור:</strong> <span className="break-words">{result.pricingModel}</span></div>}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                                    <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">🔐 Authentication</h3>
                                    <div className="space-y-2 text-xs sm:text-sm">
                                        <div><strong>נדרש אימות:</strong> {result.requiresAuth === true ? '✅ כן' : result.requiresAuth === false ? '❌ לא' : result.requiresAuth}</div>
                                        {result.authType && result.authType !== 'לא נמצא מידע' && <div><strong>🔑 סוג אימות:</strong> {result.authType}</div>}
                                        {result.rateLimits && result.rateLimits !== 'לא נמצא מידע' && <div><strong>⏱️ מגבלות:</strong> <span className="break-words">{result.rateLimits}</span></div>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {result.baseURL && (
                                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">🌐 כתובות</h3>
                                        <div className="space-y-2 text-xs sm:text-sm">
                                            <div><strong>🌐 Base URL:</strong> 
                                                <code className="block bg-white p-2 mt-1 rounded text-xs break-all font-mono text-blue-600 overflow-x-auto">
                                                    {result.baseURL}
                                                </code>
                                            </div>
                                            {result.documentationURL && (
                                                <div><strong>📚 דוקומנטציה:</strong> 
                                                    <a href={result.documentationURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline block mt-1 break-all text-xs">
                                                        🔗 {result.documentationURL}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {result.keyEndpoints && result.keyEndpoints.length > 0 && (
                                    <div className="bg-green-50 rounded-lg p-3 sm:p-4">
                                        <h3 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">🔗 Endpoints עיקריים</h3>
                                        <div className="space-y-2">
                                            {result.keyEndpoints.slice(0, 5).map((endpoint, index) => (
                                                <div key={index} className="bg-white p-2 sm:p-3 rounded border border-green-200">
                                                    <code className="font-mono text-xs sm:text-sm text-green-700 block break-all">
                                                        {typeof endpoint === "string" ? 
                                                            (endpoint.includes(' ') ? 
                                                                `${endpoint.split(' ')[0]} ${result.baseURL || ''}${endpoint.split(' ')[1]}` : 
                                                                `GET ${result.baseURL || ''}${endpoint}`
                                                            ) : 
                                                            `${endpoint.method} ${result.baseURL || ''}${endpoint.path}`
                                                        }
                                                    </code>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {result.baseURL && result.keyEndpoints && result.keyEndpoints.length > 0 && (
                            <div className="mt-6 bg-gray-900 rounded-lg p-3 sm:p-4">
                                <h3 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                                    <Code />
                                    💻 דוגמת קוד JavaScript
                                </h3>
                                <pre className="bg-gray-800 text-green-400 p-3 sm:p-4 rounded-lg text-xs sm:text-sm overflow-x-auto border border-gray-700">
                                    <code className="whitespace-pre-wrap break-words">{generateCodeExample(result)}</code>
                                </pre>
                                {result.exampleRequest && (
                                    <div className="mt-3">
                                        <h4 className="text-white text-xs sm:text-sm font-medium mb-2">🛠️ דוגמת cURL:</h4>
                                        <pre className="bg-gray-800 text-yellow-400 p-2 sm:p-3 rounded text-xs overflow-x-auto border border-gray-700">
                                            <code className="whitespace-pre-wrap break-words">{result.exampleRequest}</code>
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}

                        {result.sdkAvailable === true && (
                            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center gap-2 text-blue-800">
                                    <FileText className="flex-shrink-0" />
                                    <span className="font-medium text-sm sm:text-base">📦 SDK זמין עבור שירות זה</span>
                                </div>
                                <p className="text-blue-700 text-xs sm:text-sm mt-1">ניתן למצוא ספריות רשמיות ב-GitHub או באתר המפתחים של השירות</p>
                            </div>
                        )}

                        {result.sources && result.sources.length > 0 && (
                            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                                <h4 className="font-semibold text-yellow-800 mb-2 text-sm">📖 מקורות המידע:</h4>
                                <ul className="text-yellow-700 text-xs space-y-1">
                                    {result.sources.map((source, index) => (
                                        <li key={index}>• {source}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={copyResults}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 text-sm"
                            >
                                <Copy />
                                העתק תוצאות
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2 text-sm"
                            >
                                <RotateCcw />
                                נתח אתר אחר
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-6 sm:mt-8 text-center text-gray-500 text-xs sm:text-sm">
                    <p>מופעל על ידי Claude עם חיפוש אמיתי ברשת | נבנה עבור מפתחים ישראליים 🇮🇱</p>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<APIDetectorBot />, document.getElementById('root'));