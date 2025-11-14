
import { useState, useEffect } from 'react';
import { Article } from '@/entities/Article';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Trash2, Eye, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const DuplicateGroup = ({ group, onDeleteArticles, onViewArticle }) => {
  const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());

  const handleToggleSelection = (articleId) => {
    setSelectedForDeletion(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedForDeletion.size === 0) {
      alert('אנא בחר מאמרים למחיקה');
      return;
    }

    if (selectedForDeletion.size === group.articles.length) {
      alert('לא ניתן למחוק את כל המאמרים בקבוצה. השאר לפחות אחד.');
      return;
    }

    const articlesToDelete = Array.from(selectedForDeletion);
    const titles = group.articles
      .filter(a => articlesToDelete.includes(a.id))
      .map(a => a.title)
      .join('\n- ');

    if (confirm(`האם אתה בטוח שברצונך למחוק ${articlesToDelete.length} מאמרים?\n\n- ${titles}\n\nפעולה זו אינה הפיכה.`)) {
      onDeleteArticles(articlesToDelete);
      setSelectedForDeletion(new Set());
    }
  };

  return (
    <Card className="mb-6 border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Copy className="w-5 h-5 text-red-500" />
              כפילות זוהתה - {group.articles.length} מאמרים
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              <strong>כותרת:</strong> {group.articles[0].title}
            </p>
            <p className="text-xs text-gray-500">
              דמיון תוכן: {Math.round(group.similarity * 100)}%
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={selectedForDeletion.size === 0}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחק נבחרים ({selectedForDeletion.size})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">בחר</TableHead>
                <TableHead>כותרת</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>תאריך יצירה</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>צפיות</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.articles.map(article => (
                <TableRow key={article.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedForDeletion.has(article.id)}
                      onCheckedChange={() => handleToggleSelection(article.id)}
                    />
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate font-medium">{article.title}</div>
                    <div className="text-xs text-gray-500">ID: {article.id}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{article.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(article.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "default" : "secondary"}>
                      {article.published ? 'פורסם' : 'טיוטה'}
                    </Badge>
                  </TableCell>
                  <TableCell>{article.views || 0}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewArticle(article)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DuplicateManager() {
  const [articles, setArticles] = useState([]);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [stats, setStats] = useState({
    totalArticles: 0,
    duplicateGroups: 0,
    duplicateArticles: 0
  });

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const allArticles = await Article.list('-created_date');
      setArticles(allArticles);
      setStats(prev => ({ ...prev, totalArticles: allArticles.length }));
    } catch (error) {
      console.error('שגיאה בטעינת המאמרים:', error);
    } finally {
      setLoading(false);
    }
  };

  const findDuplicates = async () => {
    setAnalyzing(true);
    setAnalysisProgress(0);
    setDuplicateGroups([]);

    // Allow UI to update to show "Analyzing..."
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const titleMap = new Map();
      articles.forEach(article => {
        const title = article.title.trim().toLowerCase();
        if (!titleMap.has(title)) {
          titleMap.set(title, []);
        }
        titleMap.get(title).push(article);
      });

      const duplicates = [];
      for (const [title, articleGroup] of titleMap.entries()) {
        if (articleGroup.length > 1) {
          duplicates.push({
            similarity: 1.0, // Because titles are identical
            articles: articleGroup.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          });
        }
      }

      setDuplicateGroups(duplicates);
      setStats(prev => ({
        ...prev,
        duplicateGroups: duplicates.length,
        duplicateArticles: duplicates.reduce((sum, group) => sum + group.articles.length, 0)
      }));

    } catch (error) {
      console.error('שגיאה בניתוח כפילויות:', error);
      alert(`שגיאה בניתוח: ${error.message}`);
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(100);
    }
  };

  const handleBulkDeleteDuplicates = async (strategy = 'newest') => {
    if (duplicateGroups.length === 0) {
      alert('אין כפילויות למחיקה');
      return;
    }

    const totalDuplicates = duplicateGroups.reduce((sum, group) => sum + group.articles.length - 1, 0);

    if (!confirm(`פעולה זו תמחק ${totalDuplicates} מאמרים כפולים ותשאיר מאמר אחד מכל קבוצה.\n\nאסטרטגיה: ${strategy === 'newest' ? 'השאר הכי חדש' : strategy === 'most_viewed' ? 'השאר עם הכי הרבה צפיות' : strategy === 'published' ? 'השאר פורסם' : 'השאר הראשון'}\n\nהאם להמשיך?`)) {
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(0);

    try {
      let deletedCount = 0;
      const totalToDelete = totalDuplicates;

      for (let i = 0; i < duplicateGroups.length; i++) {
        const group = duplicateGroups[i];

        // Choose which article to keep based on strategy
        let articleToKeep = group.articles[0]; // Default to first

        switch (strategy) {
          case 'newest':
            articleToKeep = group.articles.reduce((newest, current) =>
              new Date(current.created_date) > new Date(newest.created_date) ? current : newest
            );
            break;
          case 'most_viewed':
            articleToKeep = group.articles.reduce((mostViewed, current) =>
              (current.views || 0) > (mostViewed.views || 0) ? current : mostViewed
            );
            break;
          case 'published':
            // Prioritize published, then fallback to newest if multiple published or none
            const publishedArticles = group.articles.filter(a => a.published);
            if (publishedArticles.length > 0) {
              articleToKeep = publishedArticles.reduce((newestPub, currentPub) =>
                new Date(currentPub.created_date) > new Date(newestPub.created_date) ? currentPub : newestPub
              );
            } else {
              // If no published, keep the newest among all
              articleToKeep = group.articles.reduce((newest, current) =>
                new Date(current.created_date) > new Date(newest.created_date) ? current : newest
              );
            }
            break;
          default:
            // Keep the first one (which is the newest by default sort in findDuplicates)
            articleToKeep = group.articles[0];
        }

        // Delete all others
        const articlesToDelete = group.articles.filter(a => a.id !== articleToKeep.id);

        for (const article of articlesToDelete) {
          try {
            await Article.delete(article.id);
            deletedCount++;
            setAnalysisProgress((deletedCount / totalToDelete) * 100);
          } catch (error) {
            console.error(`שגיאה במחיקת מאמר ${article.id}:`, error);
            // Even if one fails, continue trying others but inform user later
          }
        }
      }

      alert(`מחיקה הושלמה! נמחקו ${deletedCount} מאמרים כפולים.`);

      // Refresh data
      await loadArticles();
      setDuplicateGroups([]);
      setStats(prev => ({ ...prev, duplicateGroups: 0, duplicateArticles: 0 }));

    } catch (error) {
      console.error('שגיאה במחיקה המונית:', error);
      alert('שגיאה במחיקה המונית');
    } finally {
      setAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleDeleteArticles = async (articleIds) => {
    try {
      // Delete articles
      await Promise.all(articleIds.map(id => Article.delete(id)));

      // Refresh data
      await loadArticles();

      // Remove deleted articles from current duplicate groups
      setDuplicateGroups(prev =>
        prev.map(group => ({
          ...group,
          articles: group.articles.filter(article => !articleIds.includes(article.id))
        }))
        .filter(group => group.articles.length > 1) // Only keep groups with more than one article remaining
      );

      alert(`${articleIds.length} מאמרים נמחקו בהצלחה`);

    } catch (error) {
      console.error('שגיאה במחיקת מאמרים:', error);
      alert('שגיאה במחיקת מאמרים');
    }
  };

  const handleViewArticle = (article) => {
    // Open article in new tab (you can customize this URL pattern)
    window.open(`/article?id=${article.id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>טוען מאמרים...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-orange-100 p-3 rounded-xl">
            <Copy className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">זיהוי כפילויות</h2>
            <p className="text-gray-600">מצא ומחק מאמרים כפולים באתר</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={findDuplicates}
            disabled={analyzing || articles.length === 0}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Search className="w-5 h-5 ml-2" />
            {analyzing && duplicateGroups.length === 0 ? 'מנתח...' : 'חפש כפילויות'}
          </Button>

          {duplicateGroups.length > 0 && !analyzing && (
            <div className="flex gap-1">
              <Button
                onClick={() => handleBulkDeleteDuplicates('newest')}
                variant="destructive"
                size="sm"
              >
                מחק הכל - השאר חדש
              </Button>
              <Button
                onClick={() => handleBulkDeleteDuplicates('most_viewed')}
                variant="destructive"
                size="sm"
              >
                מחק הכל - השאר נצפה
              </Button>
              <Button
                onClick={() => handleBulkDeleteDuplicates('published')}
                variant="destructive"
                size="sm"
              >
                מחק הכל - השאר פורסם
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סך מאמרים</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">קבוצות כפילויות</p>
                <p className="text-2xl font-bold text-red-600">{stats.duplicateGroups}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <Copy className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">מאמרים כפולים</p>
                <p className="text-2xl font-bold text-orange-600">{stats.duplicateArticles}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {analyzing && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">
                {duplicateGroups.length === 0 ? 'מנתח כפילויות...' : 'מוחק כפילויות...'}
              </h3>
              <Progress value={analysisProgress} className="w-full mb-2" />
              <p className="text-sm text-gray-600">{Math.round(analysisProgress)}% הושלם</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!analyzing && duplicateGroups.length === 0 && stats.totalArticles > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            לא נמצאו כפילויות! כל המאמרים באתר הם ייחודיים.
          </AlertDescription>
        </Alert>
      )}

      {/* Duplicate Groups */}
      {duplicateGroups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">כפילויות שנמצאו ({duplicateGroups.length})</h3>
            <div className="text-sm text-gray-600">
              סה"כ {duplicateGroups.reduce((sum, group) => sum + group.articles.length - 1, 0)} מאמרים יוכלו להימחק
            </div>
          </div>

          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>הערה חשובה:</strong> הכלי מזהה כפילויות על בסיס <strong>כותרות זהות לחלוטין</strong>.
              מאמר שמוקצה למספר קטגוריות הוא לא כפילות.
            </AlertDescription>
          </Alert>

          {duplicateGroups.map((group, index) => (
            <DuplicateGroup
              key={index}
              group={group}
              onDeleteArticles={handleDeleteArticles}
              onViewArticle={handleViewArticle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
