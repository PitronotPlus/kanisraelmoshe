import React, { useState, useEffect, useCallback } from 'react';
import { Article } from '@/entities/Article';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Trash2, Eye, RefreshCw, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

// Helper function to count words in HTML content
const countWords = (htmlString) => {
  if (!htmlString) return 0;
  // Remove HTML tags, then count words
  const text = htmlString.replace(/<[^>]*>/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
};

export default function ThinContentManager() {
  const [allArticles, setAllArticles] = useState([]);
  const [thinArticles, setThinArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const WORD_COUNT_THRESHOLD = 20; // Changed from 100 to 20

  const loadAndProcessArticles = useCallback(async () => {
    try {
      setLoading(true);
      const BATCH_SIZE = 200;
      let allLoadedArticles = [];
      let offset = 0;
      let hasMore = true;

      // Load all articles in batches
      while (hasMore) {
        const batch = await Article.list('-created_date', BATCH_SIZE, offset);
        
        if (batch.length === 0) {
          hasMore = false;
          break;
        }
        
        allLoadedArticles = [...allLoadedArticles, ...batch];
        offset += BATCH_SIZE;
        
        // Small delay between batches to prevent overload
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setAllArticles(allLoadedArticles);

      const filtered = allLoadedArticles.filter(article => countWords(article.content) < WORD_COUNT_THRESHOLD);
      setThinArticles(filtered);
      setSelectedArticles(new Set());
    } catch (error) {
      console.error("שגיאה בטעינת מאמרים:", error);
      alert("שגיאה בטעינת המאמרים.");
    } finally {
      setLoading(false);
    }
  }, [WORD_COUNT_THRESHOLD]); // Added WORD_COUNT_THRESHOLD to dependencies

  useEffect(() => {
    loadAndProcessArticles();
  }, [loadAndProcessArticles]);

  const handleSelect = (articleId, checked) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(articleId);
      } else {
        newSet.delete(articleId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedArticles(new Set(thinArticles.map(a => a.id)));
    } else {
      setSelectedArticles(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArticles.size === 0) {
      alert("אנא בחר מאמרים למחיקה.");
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedArticles.size} מאמרים? פעולה זו אינה הפיכה.`)) {
      return;
    }

    setIsProcessing(true);
    const selectedIds = Array.from(selectedArticles);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process articles one by one with delays to prevent server overload
      for (let i = 0; i < selectedIds.length; i++) {
        const articleId = selectedIds[i];
        try {
          await Article.delete(articleId);
          successCount++;

          // Add small delay between deletions to prevent rate limiting
          if (i < selectedIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          }

        } catch (error) {
          console.error(`Failed to delete article ${articleId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`נמחקו בהצלחה ${successCount} מאמרים${failCount > 0 ? `, ${failCount} מחיקות נכשלו` : ''}.`);
        await loadAndProcessArticles(); // Reload data
      } else {
        alert("לא ניתן היה למחוק אף מאמר. נסה שוב מאוחר יותר.");
      }

    } catch (error) {
      console.error("שגיאה במחיקת המאמרים:", error);
      alert("שגיאה במחיקת המאמרים. נסה שוב מאוחר יותר.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAllSelected = thinArticles.length > 0 && selectedArticles.size === thinArticles.length;

  if (loading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
        <p>סורק מאמרים, זה עשוי לקחת מספר רגעים...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-red-100 p-3 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">מנהל תוכן דל</h2>
            <p className="text-gray-600">מצא ונקה מאמרים עם פחות מ-{WORD_COUNT_THRESHOLD} מילים.</p>
          </div>
        </div>
        <Button onClick={loadAndProcessArticles} variant="outline" disabled={loading}>
          <RefreshCw className="w-4 h-4 ml-2" />
          רענן
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-600">מאמרים עם תוכן דל שנמצאו</p>
            <p className="text-3xl font-bold text-red-600">{thinArticles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-sm text-gray-600">סה"כ מאמרים באתר</p>
            <p className="text-3xl font-bold text-gray-900">{allArticles.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>מאמרים שנמצאו</CardTitle>
                    <CardDescription>להלן רשימת המאמרים עם פחות מ-{WORD_COUNT_THRESHOLD} מילים.</CardDescription>
                </div>
                {selectedArticles.size > 0 && (
                    <Button
                        onClick={handleDeleteSelected}
                        disabled={selectedArticles.size === 0 || isProcessing}
                        variant="destructive"
                        className="flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                מוחק מאמרים ({Array.from(selectedArticles).length})...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                מחק נבחרים ({selectedArticles.size})
                            </>
                        )}
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
          {thinArticles.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="font-semibold">מעולה!</p>
              <p>לא נמצאו מאמרים עם תוכן דל.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>כותרת</TableHead>
                    <TableHead className="w-32 text-center">ספירת מילים</TableHead>
                    <TableHead className="w-48 text-center">תאריך יצירה</TableHead>
                    <TableHead className="w-32 text-center">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {thinArticles.map(article => (
                    <TableRow key={article.id}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedArticles.has(article.id)}
                          onCheckedChange={(checked) => handleSelect(article.id, checked)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{article.title}</TableCell>
                      <TableCell className="text-center text-red-600 font-bold">
                        {countWords(article.content)}
                      </TableCell>
                      <TableCell className="text-center">
                        {format(new Date(article.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={createPageUrl(`Article?id=${article.id}`)} target="_blank">
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}