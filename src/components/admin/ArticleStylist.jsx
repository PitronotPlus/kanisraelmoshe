
import { useState, useEffect, useMemo, useRef } from "react";
import { Article } from "@/entities/Article";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Wand2, CheckSquare, Sparkles, XSquare } from "lucide-react"; // Added CheckSquare, Sparkles, XSquare
import { styleArticle } from "@/functions/styleArticle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";


export default function ArticleStylist() {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]); // Added
  const [currentPage, setCurrentPage] = useState(1); // Added
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStyleStatus, setFilterStyleStatus] = useState("unstyled");
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  // Replaced processingResult with processingStats and logs
  const [processingStats, setProcessingStats] = useState({ processed: 0, successful: 0, failed: 0, total: 0 });
  const [logs, setLogs] = useState([]); // Renamed from processingLogs
  const [showLogs, setShowLogs] = useState(false); // New state to control log visibility
  const logContainerRef = useRef(null);
  const articlesPerPage = 10;

  useEffect(() => {
    loadArticles();
  }, []);

  useEffect(() => {
    setFilteredArticles(getFilteredArticles());
    setCurrentPage(1);
  }, [articles, searchQuery, filterStatus, filterStyleStatus]);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]); // Changed dependency to logs

  // Modified global addLog to use 'he-IL' locale and store objects for type styling
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('he-IL');
    setLogs(prev => [...prev, { timestamp, message, type }]);
    // Also log to console for debugging purposes, distinguishing types
    if (type === 'error' || type === 'warn') {
      console.error(`${timestamp} [${type.toUpperCase()}] ${message}`);
    } else {
      console.log(`${timestamp} [${type.toUpperCase()}] ${message}`);
    }
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await Article.list('-created_date');
      setArticles(data);
    } catch (error) {
      console.error('Error loading articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredArticles = () => {
    let filtered = articles;
    const currentYear = new Date().getFullYear();
    
    // סינון לפי סטטוס
    if (filterStatus !== 'all') {
      filtered = filtered.filter(article => article.status === filterStatus);
    }
    
    // סינון לפי סטטוס סגנון
    if (filterStyleStatus === 'styled') {
      filtered = filtered.filter(article => {
        if (!article.styled_date) return false;
        const styledYear = new Date(article.styled_date).getFullYear();
        return styledYear >= currentYear;
      });
    } else if (filterStyleStatus === 'unstyled') {
      filtered = filtered.filter(article => {
        if (!article.styled_date) return true;
        const styledYear = new Date(article.styled_date).getFullYear();
        return styledYear < currentYear;
      });
    }
    
    // סינון לפי חיפוש
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(query) ||
        (article.content && article.content.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  };

  // עדכון הסטטיסטיקות
  const styledCount = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return articles.filter(article => {
      if (!article.styled_date) return false;
      const styledYear = new Date(article.styled_date).getFullYear();
      return styledYear >= currentYear;
    }).length;
  }, [articles]);
  
  const unstyledCount = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return articles.filter(article => {
      if (!article.styled_date) return true;
      const styledYear = new Date(article.styled_date).getFullYear();
      return styledYear < currentYear;
    }).length;
  }, [articles]);

  const resetAllStylingStatus = () => {
    alert(`המערכת מוכנה לעבודה!

מעכשיו:
• מאמרים מעוצבים: רק מאמרים שיעברו במסגנן החדש (שיסומנו עם תאריך עיצוב של השנה הנוכחית)
• זקוקים לעיצוב: כל השאר (מאמרים ללא תאריך עיצוב, או עם תאריך עיצוב משנה קודמת)

אין צורך באיפוס ידני. פשוט התחל לעבוד עם המסגנן!`);
  };

  const handleSelectAllUnstyled = () => {
    const currentYear = new Date().getFullYear();
    const unstyledIds = articles
      .filter(article => {
        if (!article.styled_date) return true;
        const styledYear = new Date(article.styled_date).getFullYear();
        return styledYear < currentYear;
      })
      .map(a => a.id);
    setSelectedArticles(new Set(unstyledIds));
    addLog(`נבחרו ${unstyledIds.length} מאמרים הזקוקים לעיצוב (מכלל המאמרים באתר)`, 'info');
  };

  const handleSelectPage = () => {
    const allIds = new Set([...selectedArticles, ...getCurrentPageArticles().map(a => a.id)]);
    setSelectedArticles(allIds);
    addLog(`נבחרו ${getCurrentPageArticles().length} מאמרים מהעמוד הנוכחי`, 'info');
  };

  const handleDeselectAll = () => {
    setSelectedArticles(new Set());
    addLog('כל המאמרים בוטלו מבחירה', 'info');
  };

  const handleStyleArticles = async () => {
    if (selectedArticles.size === 0) {
      alert('אנא בחר מאמרים לעיצוב');
      return;
    }

    if (!confirm(`האם לעצב ${selectedArticles.size} מאמרים? התהליך עשוי לארוך זמן רב עקב הגבלות API.`)) {
      return;
    }

    setIsProcessing(true);
    setProcessingStats({ processed: 0, successful: 0, failed: 0, total: selectedArticles.size });
    setLogs([]); // Clear previous logs
    setShowLogs(true); // Show the log panel

    const articleIds = Array.from(selectedArticles);
    const batchSize = 2; // Reduced batch size for better stability
    const batches = [];
    
    for (let i = 0; i < articleIds.length; i += batchSize) {
      batches.push(articleIds.slice(i, i + batchSize));
    }

    let allSuccessful = [];
    let allFailed = [];

    addLog('🚀 מתחיל תהליך עיצוב מאמרים...', 'info');
    addLog('⚠️ זהירות: התהליך עשוי להיות איטי עקב הגבלות API', 'warn');

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        let batchSuccess = false;
        let retryCount = 0;
        const maxRetries = 2; // Reduced retries

        addLog(`📦 מעבד קבוצה ${i + 1}/${batches.length} (${batch.length} מאמרים)...`, 'info');
        
        while (!batchSuccess && retryCount <= maxRetries) {
            try {
                // Call styleArticle without 'mode: "style"' as per outline
                const { data: result } = await styleArticle({ articleIds: batch });
                
                if (result.success) {
                    batchSuccess = true;
                    const successCount = result.successfulArticles?.length || 0;
                    const failCount = result.failedArticles?.length || 0;
                    
                    allSuccessful.push(...(result.successfulArticles || []));
                    allFailed.push(...(result.failedArticles || []));
                    
                    addLog(`✅ קבוצה ${i + 1} הושלמה: ${successCount} הצליחו, ${failCount} נכשלו`, 'success');
                    
                    // Log individual article results
                    if (result.successfulArticles) {
                        result.successfulArticles.forEach(id => {
                            const article = articles.find(a => a.id === id);
                            addLog(`   ✅ עוצב: "${article?.title || id}"`, 'success');
                        });
                    }
                    
                    if (result.failedArticles) {
                        result.failedArticles.forEach(failed => {
                            const article = articles.find(a => a.id === failed.id);
                            addLog(`   ❌ נכשל: "${article?.title || failed.id}" - ${failed.error}`, 'error');
                        });
                    }
                } else {
                    throw new Error(result.message || 'Unknown error from styling function');
                }
                
            } catch (error) {
                retryCount++;
                const errorMessage = error.response?.data?.message || error.message;
                
                // Check if it's a retryable error - be more conservative
                const isRetryableError = errorMessage.includes('timeout') || 
                                       errorMessage.includes('Network Error') ||
                                       error.code === 'ECONNABORTED';
                
                if (isRetryableError && retryCount <= maxRetries) {
                    const waitTime = Math.min(20 * retryCount, 60); // 20s, 40s, max 60s
                    addLog(`⏰ שגיאת רשת זמנית בקבוצה ${i + 1}. ממתין ${waitTime} שניות לניסיון ${retryCount + 1}/${maxRetries + 1}...`, 'warn');
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                    continue;
                } else {
                    // Either max retries exceeded or non-retryable error (like rate limit)
                    if (errorMessage.includes('Rate limit') || errorMessage.includes('rate limit')) {
                        addLog(`🚫 קבוצה ${i + 1} נכשלה - הגעת להגבלת API. המתן זמן רב יותר לפני ניסיון נוסף`, 'error');
                    } else {
                        addLog(`🚫 קבוצה ${i + 1} נכשלה${retryCount > maxRetries ? ' לאחר מספר ניסיונות' : ''}: ${errorMessage}`, 'error');
                    }
                    
                    batch.forEach(id => {
                        const article = articles.find(a => a.id === id);
                        allFailed.push({ id, error: errorMessage });
                        addLog(`   ❌ נכשל: "${article?.title || id}"`, 'error');
                    });
                    batchSuccess = true; // Exit retry loop to continue with next batch
                }
            }
        }
        
        // Update progress
        setProcessingStats(prev => ({
            ...prev,
            processed: prev.processed + batch.length,
            successful: allSuccessful.length,
            failed: allFailed.length
        }));
        
        // Longer delay between batches to avoid rate limiting
        if (i < batches.length - 1 && batchSuccess) {
            addLog('--- ממתין 10 שניות לפני הקבוצה הבאה (למניעת rate limit) ---', 'info');
            await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds between batches
        }
    }

    // Final summary
    addLog(`\n🎯 סיכום: ${allSuccessful.length} מאמרים עוצבו בהצלחה, ${allFailed.length} נכשלו`, 'info');
    
    if (allFailed.length > 0) {
        const rateLimitFailed = allFailed.filter(f => f.error && (f.error.includes('Rate limit') || f.error.includes('rate limit'))).length;
        if (rateLimitFailed > 0) {
            addLog(`⚠️ ${rateLimitFailed} נכשלו עקב הגבלת API. נסה שוב מאוחר יותר`, 'warn');
        }
    }
    
    if (allSuccessful.length > 0) {
      await loadArticles(); // Refresh article list if any article was successful
      setSelectedArticles(new Set()); // Clear selection only if articles were successfully processed
    }

    setIsProcessing(false);
  };

  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    return filteredArticles.slice(startIndex, startIndex + articlesPerPage);
  };

  const toggleArticleSelection = (id) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">מסגנן מאמרים</h3>
          <p className="text-gray-600">עיצוב אוטומטי של מאמרים - הפרדת פסקאות ועיצוב מקצועי</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetAllStylingStatus}
          className="text-blue-600 hover:text-blue-700"
        >
          💡 הסבר מערכת הסימון
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p>סך הכל: {articles.length}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-green-600">מעוצבים: {styledCount}</CardContent></Card>
        <Card><CardContent className="p-4 text-orange-600">זקוקים לעיצוב: {unstyledCount}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>בחירת מאמרים</CardTitle>
          <CardDescription>בחר מאמרים מהרשימה ושלח אותם לעיצוב</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse flex-1 flex-wrap gap-y-2">
              <Input placeholder="חפש..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-sm" />
              <Select value={filterStyleStatus} onValueChange={setFilterStyleStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="סטטוס עיצוב" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="styled">מעוצבים</SelectItem>
                  <SelectItem value="unstyled">לא מעוצבים</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleSelectPage} variant="outline" size="sm" className="text-sm">
                <CheckSquare className="w-4 h-4 ml-2" />
                בחר הכל בעמוד
              </Button>
              <Button onClick={handleSelectAllUnstyled} variant="outline" size="sm" className="text-sm bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                <Sparkles className="w-4 h-4 ml-2" />
                בחר את כל הזקוקים לעיצוב
              </Button>
              <Button onClick={handleDeselectAll} variant="outline" size="sm" className="text-sm">
                <XSquare className="w-4 h-4 ml-2" />
                בטל בחירה
              </Button>
            </div>
          </div>
          
          {(isProcessing || showLogs) && ( // Show logs if processing or if logs were explicitly requested
             <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold mb-2">לוג עיבוד בזמן אמת:</h4>
              {processingStats.total > 0 && (
                 <div className="mb-2 text-sm">
                   סטטוס: {processingStats.successful} הצליחו, {processingStats.failed} נכשלו מתוך {processingStats.total}
                 </div>
              )}
              <div 
                ref={logContainerRef} 
                className="p-2 bg-gray-900 text-white font-mono text-xs rounded-lg max-h-60 overflow-y-auto shadow-inner"
              >
                {logs.map((log, index) => ( // Using 'logs' state
                  <div key={index} className={`whitespace-pre-wrap py-0.5 ${
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'warn' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500 text-xs mr-2">{log.timestamp}</span> {log.message}
                  </div>
                ))}
                {isProcessing && (
                  <div className="text-blue-400 animate-pulse text-sm mt-1">⏳ מעבד...</div>
                )}
              </div>
              {logs.length > 0 && ( // Allow clearing logs only if there are logs
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2" 
                  onClick={() => {setLogs([]); setShowLogs(false);}} // Clear and hide logs
                >
                  נקה לוג
                </Button>
              )}
            </div>
          )}

          {selectedArticles.size > 0 && !isProcessing && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              נבחרו {selectedArticles.size} מאמרים.
              <Button variant="ghost" size="sm" onClick={handleDeselectAll}>נקה בחירה</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ביצוע פעולה</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleStyleArticles} disabled={isProcessing || selectedArticles.size === 0}>
            <Wand2 className="w-4 h-4 ml-2" />
            {isProcessing ? `מעבד (${processingStats.processed}/${processingStats.total})...` : `עצב ${selectedArticles.size} מאמרים נבחרים`}
          </Button>
        </CardContent>
      </Card>
      
      <div className="space-y-2">
        {getCurrentPageArticles().map(article => {
          const currentYear = new Date().getFullYear();
          const isVirtuallyStyled = article.styled_date && new Date(article.styled_date).getFullYear() >= currentYear;
          return (
            <div key={article.id} className="flex items-center p-2 border rounded-md bg-white">
              <Checkbox checked={selectedArticles.has(article.id)} onCheckedChange={() => toggleArticleSelection(article.id)} />
              <span className="mr-4 flex-1">{article.title}</span>
              {isVirtuallyStyled ? <Badge variant="default" className="bg-green-100 text-green-800">מעוצב</Badge> : <Badge variant="secondary">לא עוצב</Badge>}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center items-center space-x-2 space-x-reverse">
        <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>הקודם</Button>
        <span>עמוד {currentPage} מתוך {Math.ceil(filteredArticles.length / articlesPerPage)}</span>
        <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredArticles.length / articlesPerPage)))} disabled={currentPage * articlesPerPage >= filteredArticles.length}>הבא</Button>
      </div>
    </div>
  );
}
