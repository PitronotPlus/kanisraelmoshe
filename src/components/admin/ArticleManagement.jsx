import React, { useState, useEffect, useCallback } from "react";
import { Article } from "@/entities/Article";
import { Category } from "@/entities/Category";
import { User } from "@/entities/User"; // Import User entity
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"; // New import for dropdown menus
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // New imports for table components
import { Link } from 'react-router-dom'; // Fixed import - using react-router-dom instead of next/link

import { CheckCircle2, Circle, Edit, Trash2, Search, Plus, Newspaper, Bot, RefreshCw, CalendarIcon, Users, Eye, ChevronDown, CheckSquare, Sparkles, XSquare } from "lucide-react"; // Add new icons
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { rewriteArticle } from "@/functions/rewriteArticle";
import { createPageUrl } from "@/utils"; // Import createPageUrl from utils

// New ArticleRow Component to encapsulate a single article's row logic
const ArticleRow = ({ article, onUpdateStatus, onDelete, onReassign, onEditArticle }) => {
  const getStatusBadge = useCallback((status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">פורסם</Badge>;
      case 'draft':
        return <Badge variant="secondary">טיוטה</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">ממתין לאישור</Badge>;
      default:
        return <Badge variant="destructive">לא ידוע</Badge>;
    }
  }, []);

  const displayDate = article.original_publication_date || article.created_date;

  return (
    <TableRow>
      <TableCell className="p-4 w-12 text-center">
        <Checkbox
           checked={article.isSelected} // `isSelected` and `onSelect` are passed from parent for checkbox state
           onCheckedChange={(checked) => article.onSelect(article.id, checked)}
        />
      </TableCell>
      <TableCell className="p-4 font-medium text-right max-w-md truncate">{article.title}</TableCell>
      <TableCell className="p-4 text-right">{article.displayAuthorName}</TableCell> {/* Use displayAuthorName passed from parent */}
      <TableCell className="p-4 text-right">{article.category}</TableCell>
      <TableCell className="p-4 text-gray-600 text-right">
        {displayDate ? format(new Date(displayDate), 'dd/MM/yyyy', { locale: he }) : 'אין תאריך'}
      </TableCell>
      <TableCell className="p-4 text-right">{getStatusBadge(article.status)}</TableCell>
      <TableCell className="p-4 text-right">
        <div className="flex gap-1 justify-end items-center">
          {article.status === 'pending_approval' && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50"
              onClick={() => onUpdateStatus(article.id, 'published')} // Approving means publishing
            >
              <CheckCircle2 className="w-4 h-4 ml-1" />
              אשר
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild>
            <Link to={createPageUrl(`Article?id=${article.id}`)} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEditArticle(article)}>
            <Edit className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {article.status === 'published' ? (
                <DropdownMenuItem onClick={() => onUpdateStatus(article.id, 'draft')}>
                  <Circle className="w-4 h-4 ml-2" />
                  הפוך לטיוטה
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onUpdateStatus(article.id, 'published')}>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  פרסם מאמר
                </DropdownMenuItem>
              )}
              {article.status !== 'pending_approval' && (
                  <DropdownMenuItem onClick={() => onUpdateStatus(article.id, 'pending_approval')}>
                      <Circle className="w-4 h-4 ml-2" />
                      העבר להמתנה לאישור
                  </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onReassign(article.id)}> {/* onReassign for single article */}
                <Users className="w-4 h-4 ml-2" />
                שייך לכותב אחר
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-50 focus:text-red-600"
                onClick={() => onDelete(article.id, article.title)}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                מחק מאמר
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};


// Baseline article count - any articles added/deleted after this will be added to 25,866
const BASELINE_ARTICLE_COUNT = 25866;

export default function ArticleManagement({ onEditArticle, onNewArticle }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]); // Add users state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [originalAuthorFilter, setOriginalAuthorFilter] = useState("all"); // סינון לפי שם מקורי
  const [assignedAuthorFilter, setAssignedAuthorFilter] = useState("all"); // סינון לפי עורך משויך
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [baselineCount, setBaselineCount] = useState(null); // Real count when baseline was set

  // State for bulk actions
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [bulkActionMessage, setBulkActionMessage] = useState("");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuthorModalOpen, setIsAuthorModalOpen] = useState(false); // הוספת state למודל
  const [targetCategory, setTargetCategory] = useState("");
  const [targetAuthor, setTargetAuthor] = useState(""); // הוספת state לכותב

  // New state for pagination and enhanced selection
  const [currentPage, setCurrentPage] = useState(1);
  const [selectAllSystemWide, setSelectAllSystemWide] = useState(false);
  const articlesPerPage = 100;

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [articleData, categoryData, userData] = await Promise.all([
        Article.list('-created_date'), // Assuming Article.list fetches all necessary fields including 'status'
        Category.list(),
        User.list() // Load all users
      ]);
      
      // Set baseline count on first load (store the real count)
      const storedBaseline = localStorage.getItem('article_baseline_count');
      if (!storedBaseline) {
        localStorage.setItem('article_baseline_count', articleData.length.toString());
        setBaselineCount(articleData.length);
      } else {
        setBaselineCount(parseInt(storedBaseline));
      }
      
      setArticles(articleData);
      setCategories(categoryData.filter(c => !c.parent_id));
      setUsers(userData.filter(u => u.status === 'approved' || u.role === 'admin')); // Filter users by status or role
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (articleId, title) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את המאמר "${title}"? פעולה זו אינה הפיכה.`)) {
      try {
        await Article.delete(articleId);
        setArticles(articles.filter(a => a.id !== articleId));
        setSelectedArticles(prev => { // Also remove from selected if deleted
            const newSet = new Set(prev);
            newSet.delete(articleId);
            return newSet;
        });
        alert('המאמר נמחק בהצלחה');
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('שגיאה במחיקת המאמר');
      }
    }
  };

  // Generalized function to update article status (replaces handleTogglePublish)
  const handleUpdateArticleStatus = async (articleId, newStatus) => {
    try {
      await Article.update(articleId, { status: newStatus }); // Update 'status' field
      setArticles(articles.map(a =>
        a.id === articleId ? { ...a, status: newStatus } : a
      ));
      const statusText = newStatus === 'published' ? 'פורסם' : newStatus === 'draft' ? 'טיוטה' : 'ממתין לאישור';
      alert(`סטטוס המאמר עודכן בהצלחה ל"${statusText}"`);
    } catch (error) {
      console.error('Error updating article status:', error);
      alert('שגיאה בעדכון סטטוס המאמר');
    }
  };


  const handleAutoAssignByName = async () => {
    if (selectedArticles.size === 0) {
      alert("אנא בחר מאמרים קודם");
      return;
    }

    const confirmed = confirm(`האם לשייך את ${selectedArticles.size} המאמרים הנבחרים למשתמשים לפי שם הכותב? זה ינסה למצוא התאמה בין שם הכותב במאמר לשמות המשתמשים במערכת.`);
    if (!confirmed) return;

    setIsBulkLoading(true);
    setBulkActionMessage("משייך מאמרים למשתמשים...");

    let successCount = 0;
    let failureCount = 0;

    try {
      const selectedArticleIds = Array.from(selectedArticles);

      for (const articleId of selectedArticleIds) {
        const article = articles.find(a => a.id === articleId);
        if (!article || !article.author) {
          failureCount++;
          await new Promise(res => setTimeout(res, 50));
          setBulkActionMessage(`משייך... (${successCount + failureCount} מתוך ${selectedArticles.size})`);
          continue;
        }

        const matchingUser = users.find(u =>
          u.full_name.toLowerCase().trim() === article.author.toLowerCase().trim()
        );

        if (matchingUser) {
          try {
            await Article.update(articleId, {
              author_user_id: matchingUser.id,
              created_by: matchingUser.email,
              author: matchingUser.display_name || matchingUser.full_name, // שמירת השם
              author_bio: matchingUser.bio, // שמירת הביו
              author_image: matchingUser.profile_image_url, // שמירת תמונת הפרופיל
              author_social_links: matchingUser.social_links // שמירת קישורי רשתות חברתיות
            });
            successCount++;
          } catch (error) {
            console.error(`Failed to update article ${articleId}:`, error);
            failureCount++;
          }
        } else {
          failureCount++;
        }

        setBulkActionMessage(`משייך... (${successCount + failureCount} מתוך ${selectedArticles.size})`);
        await new Promise(res => setTimeout(res, 50));
      }

      await loadInitialData(); // Refresh the list after bulk operation
      setSelectedArticles(new Set());
      setSelectAllSystemWide(false);

      alert(`שיוך הושלם!\nהצלחות: ${successCount}\nכישלונות: ${failureCount}`);
    } catch (error) {
      console.error('Error in auto-assign:', error);
      alert('שגיאה בשיוך אוטומטי');
    } finally {
      setIsBulkLoading(false);
      setBulkActionMessage("");
    }
  };

  const handleAssignToUser = async (articleIdsToAssign, targetUser) => { // Now accepts an array of IDs
    if (!targetUser || articleIdsToAssign.length === 0) return;

    setIsBulkLoading(true);
    setBulkActionMessage("משייך מאמרים לעורך...");
    let updatedCount = 0;

    try {
      for (const articleId of articleIdsToAssign) {
        try {
          await Article.update(articleId, {
            created_by: targetUser.email,
            author_user_id: targetUser.id,
            author: targetUser.display_name || targetUser.full_name,
            author_bio: targetUser.bio,
            author_image: targetUser.profile_image_url,
            author_social_links: targetUser.social_links
          });
          updatedCount++;
          setBulkActionMessage(`משייך... (${updatedCount}/${articleIdsToAssign.length})`);
          await new Promise(res => setTimeout(res, 100));
        } catch (error) {
          console.error(`Failed to assign author to article ${articleId}:`, error);
        }
      }

      alert(`${updatedCount} מאמרים שויכו בהצלחה ל${targetUser.full_name}`);
    } catch (error) {
      console.error('שגיאה בשיוך מאמרים:', error);
      alert('שגיאה בשיוך המאמרים');
    } finally {
      setIsBulkLoading(false);
      setBulkActionMessage("");
      setSelectedArticles(new Set()); // Clear selection after action
      setSelectAllSystemWide(false); // Clear system-wide selection
      await loadInitialData(); // Refresh the article list
      setIsAuthorModalOpen(false); // Close the modal
    }
  };

  // Handler for reassigning a single article from the ArticleRow dropdown
  const handleReassignSingleArticle = (articleId) => {
    setSelectedArticles(new Set([articleId])); // Select only the clicked article
    setIsAuthorModalOpen(true); // Open the author assignment modal
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (article.author || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "published" && article.status === 'published') || // Check article.status
                         (statusFilter === "draft" && article.status === 'draft') ||      // Check article.status
                         (statusFilter === "pending_approval" && article.status === 'pending_approval'); // New status check
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter;

    // סינון לפי שם מקורי (השם שבשדה author)
    const matchesOriginalAuthor = originalAuthorFilter === "all" || article.author === originalAuthorFilter;

    // סינון לפי עורך משויך (לפי author_user_id)
    const matchesAssignedAuthor = assignedAuthorFilter === "all" || article.author_user_id === assignedAuthorFilter;

    // Date filtering with separate from/to dates
    const articleDate = new Date(article.original_publication_date || article.created_date);
    let matchesDate = true;

    if (fromDate) {
      const fromDateObj = new Date(fromDate);
      fromDateObj.setHours(0,0,0,0); // Start of day
      matchesDate = matchesDate && articleDate >= fromDateObj;
    }

    if (toDate) {
      const toDateObj = new Date(toDate);
      toDateObj.setHours(23, 59, 59, 999); // End of day
      matchesDate = matchesDate && articleDate <= toDateObj;
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate && matchesOriginalAuthor && matchesAssignedAuthor;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * articlesPerPage,
    currentPage * articlesPerPage
  );

  const availableCategories = [...new Set(articles.map(a => a.category).filter(Boolean))];

  // רשימת שמות מקוריים ייחודיים
  const originalAuthorNames = [...new Set(articles.map(a => a.author).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'he'));

  // Keep system-wide selection in sync with filters
  useEffect(() => {
    if (selectAllSystemWide) {
        setSelectedArticles(new Set(filteredArticles.map(a => a.id)));
    } else {
      setSelectedArticles(prev => {
        const newSet = new Set();
        for (const id of prev) {
          if (filteredArticles.some(a => a.id === id)) {
            newSet.add(id);
          }
        }
        return newSet;
      });
    }
  }, [filteredArticles, selectAllSystemWide]);

  // Bulk action handlers
  const handleSelectArticle = useCallback((articleId, checked) => {
    setSelectAllSystemWide(false);
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(articleId);
      } else {
        newSet.delete(articleId);
      }
      return newSet;
    });
  }, []);

  const handleSelectPage = useCallback((checked) => {
    setSelectAllSystemWide(false);
    const pageIds = new Set(paginatedArticles.map(a => a.id));

    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        pageIds.forEach(id => newSet.add(id));
      } else {
        pageIds.forEach(id => newSet.delete(id));
      }
      return newSet;
    });
  }, [paginatedArticles]);

  const handleSelectAllSystemWide = useCallback(() => {
    setSelectAllSystemWide(true);
    setSelectedArticles(new Set(filteredArticles.map(a => a.id)));
  }, [filteredArticles]);

  const handleBulkClearInvalidCategories = async () => {
    if (selectedArticles.size === 0) {
        alert("אנא בחר מאמרים קודם");
        return;
    }

    const confirmed = confirm(`פעולה זו תבדוק את המאמרים שבחרת. אם שם הקטגוריה ארוך מ-20 מילים, הוא ינוקה. האם להמשיך?`);
    if (!confirmed) return;

    setIsBulkLoading(true);
    setBulkActionMessage("מנקה קטגוריות שגויות...");
    
    const WORD_COUNT_THRESHOLD = 20;
    const countWords = (str) => {
        if (!str || typeof str !== 'string') return 0;
        return str.trim().split(/\s+/).filter(Boolean).length;
    };

    const articlesToUpdate = articles.filter(a => selectedArticles.has(a.id));
    const articlesToClear = articlesToUpdate.filter(a => a.category && countWords(a.category) > WORD_COUNT_THRESHOLD);
    
    if (articlesToClear.length === 0) {
        alert("לא נמצאו מאמרים עם קטגוריות שגויות בבחירה שלך.");
        setIsBulkLoading(false);
        setBulkActionMessage("");
        return;
    }

    setBulkActionMessage(`נמצאו ${articlesToClear.length} מאמרים לניקוי. מתחיל עדכון...`);
    
    await executeBulkAction('update', { category: '', subcategory: '' }, articlesToClear.map(a => a.id));
    
    // The finally block in executeBulkAction will handle the rest
  };


  const executeBulkAction = async (action, payload, articleIds = null) => {
    setIsBulkLoading(true);
    setBulkActionMessage("מעבד...");
    const selectedIds = articleIds ? articleIds : Array.from(selectedArticles);
    let successCount = 0;

    try {
        for (const id of selectedIds) {
            // Process each request sequentially to avoid rate-limiting or ensure order
            if (action === 'delete') {
                await Article.delete(id);
            } else if (action === 'rewrite') {
                await rewriteArticle({ articleId: id });
            } else if (action === 'update') {
                await Article.update(id, payload);
            }
            successCount++;
            setBulkActionMessage(`מעבד... (${successCount}/${selectedIds.length})`);

            // Re-introduce a small delay to prevent rate-limiting
            await new Promise(res => setTimeout(res, 100));
        }

      alert(`הפעולה הושלמה בהצלחה על ${successCount} מאמרים.`);
    } catch (error) {
      console.error("Bulk action failed:", error);
      alert(`שגיאה בביצוע הפעולה: ${error.message}`);
    } finally {
      setIsBulkLoading(false);
      setBulkActionMessage("");
      setSelectedArticles(new Set());
      setSelectAllSystemWide(false);
      await loadInitialData(); // Refresh data after bulk operation
    }
  };

  const handleBulkChangeCategory = () => {
    if (selectedArticles.size === 0) {
      alert("אנא בחר מאמרים קודם");
      return;
    }
    if (!targetCategory) {
      alert("אנא בחר קטגוריה");
      return;
    }
    executeBulkAction('update', { category: targetCategory, subcategory: '' }); // Assuming subcategory is cleared when changing category
    setIsCategoryModalOpen(false);
  };

  const handleBulkChangeAuthor = () => {
    if (selectedArticles.size === 0) {
      alert("אנא בחר מאמרים קודם");
      return;
    }
    if (!targetAuthor) {
      alert("אנא בחר עורך");
      return;
    }
    const selectedUser = users.find(u => u.id === targetAuthor);
    if (!selectedUser) {
        alert("משתמש לא נמצא");
        return;
    }
    handleAssignToUser(Array.from(selectedArticles), selectedUser);
  };

  const handleBulkDelete = () => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedArticles.size} מאמרים? פעולה זו אינה הפיכה.`)) {
      executeBulkAction('delete');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>טוען מאמרים...</p>
      </div>
    );
  }

  const isAllOnPageSelected = paginatedArticles.length > 0 && paginatedArticles.every(a => selectedArticles.has(a.id));
  const isIndeterminatePageSelection = paginatedArticles.some(a => selectedArticles.has(a.id)) && !isAllOnPageSelected;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Newspaper className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ניהול מאמרים</h2>
            <p className="text-gray-600">ערוך, מחק וצפה בכל המאמרים באתר</p>
          </div>
        </div>
        <Button onClick={onNewArticle} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-5 h-5 ml-2" />
          מאמר חדש
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="חיפוש מאמרים..."
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                }}
                className="pr-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="published">פורסם</SelectItem>
                <SelectItem value="draft">טיוטה</SelectItem>
                <SelectItem value="pending_approval">ממתין לאישור</SelectItem> {/* New status option */}
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value);
                setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* סינון לפי שם מקורי (השם שבשדה author) */}
            <Select value={originalAuthorFilter} onValueChange={(value) => {
                setOriginalAuthorFilter(value);
                setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="שם כותב מקורי" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הכותבים המקוריים</SelectItem>
                {originalAuthorNames.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* סינון לפי עורך משויך */}
            <Select value={assignedAuthorFilter} onValueChange={(value) => {
                setAssignedAuthorFilter(value);
                setCurrentPage(1);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="עורך משויך" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="מתאריך"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm"
            />

            <Input
              type="date"
              placeholder="עד תאריך"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm"
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-500">
              מציג {filteredArticles.length} מתוך {baselineCount !== null ? BASELINE_ARTICLE_COUNT + (articles.length - baselineCount) : articles.length} מאמרים
            </div>
             {(fromDate || toDate || originalAuthorFilter !== "all" || assignedAuthorFilter !== "all" || searchTerm !== "" || statusFilter !== "all" || categoryFilter !== "all") && (
                <Button variant="link" className="p-0 h-auto text-blue-600" onClick={() => {
                    setFromDate("");
                    setToDate("");
                    setOriginalAuthorFilter("all");
                    setAssignedAuthorFilter("all");
                    setSearchTerm("");
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setCurrentPage(1);
                }}>
                    נקה כל הסינונים
                </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedArticles.size > 0 && (
        <Card className="shadow-lg bg-blue-50 sticky top-4 z-10">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between flex-wrap gap-4">
            <div className="flex-grow">
                {selectAllSystemWide ? (
                    <div className="font-bold">
                        כל {selectedArticles.size} המאמרים במסנן נבחרו.
                        <Button variant="link" className="p-0 h-auto text-blue-700" onClick={() => { setSelectedArticles(new Set()); setSelectAllSystemWide(false); }}>נקה בחירה</Button>
                    </div>
                ) : isAllOnPageSelected && filteredArticles.length > paginatedArticles.length ? (
                    <div className="font-bold">
                        כל {paginatedArticles.length} המאמרים בעמוד זה נבחרו.
                        <Button variant="link" className="p-0 h-auto text-blue-700" onClick={handleSelectAllSystemWide}>בחר את כל {filteredArticles.length} המאמרים במסנן</Button>
                    </div>
                ) : (
                    <div className="font-bold">{selectedArticles.size} מאמרים נבחרו</div>
                )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" onClick={() => executeBulkAction('update', { status: 'published' })} disabled={isBulkLoading}>פרסם</Button>
              <Button size="sm" variant="outline" onClick={() => executeBulkAction('update', { status: 'draft' })} disabled={isBulkLoading}>הפוך לטיוטה</Button>
              <Button size="sm" variant="outline" onClick={() => executeBulkAction('update', { status: 'pending_approval' })} disabled={isBulkLoading}>העבר להמתנה לאישור</Button>

              <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => executeBulkAction('update', { hide_featured_image: false })} disabled={isBulkLoading}>הצג תמונה ראשית</Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => executeBulkAction('update', { hide_featured_image: true })} disabled={isBulkLoading}>הסתר תמונה ראשית</Button>

              <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isBulkLoading}>שנה קטגוריה</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>שנה קטגוריה עבור {selectedArticles.size} מאמרים</DialogTitle></DialogHeader>
                  <div className="py-4">
                    <Select onValueChange={setTargetCategory}>
                      <SelectTrigger><SelectValue placeholder="בחר קטגוריה חדשה..." /></SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>ביטול</Button>
                    <Button onClick={handleBulkChangeCategory}>שנה קטגוריה</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isAuthorModalOpen} onOpenChange={setIsAuthorModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isBulkLoading}>שייך לעורך</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>שייך {selectedArticles.size} מאמרים לעורך</DialogTitle></DialogHeader>
                  <div className="py-4">
                    <Select onValueChange={setTargetAuthor}>
                      <SelectTrigger><SelectValue placeholder="בחר עורך..." /></SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAuthorModalOpen(false)}>ביטול</Button>
                    <Button onClick={handleBulkChangeAuthor}>שייך עורך</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={handleBulkClearInvalidCategories} disabled={isBulkLoading}>
                <Trash2 className="w-4 h-4 ml-2"/> נקה קטגוריות שגויות
              </Button>
              
              <Button size="sm" variant="outline" className="text-purple-600 border-purple-300 hover:bg-purple-50" onClick={() => executeBulkAction('rewrite')} disabled={isBulkLoading}>
                <Bot className="w-4 h-4 ml-2"/> שכתב עם AI
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isBulkLoading}>מחק</Button>
            </div>
             {isBulkLoading && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                    <RefreshCw className="w-4 h-4 animate-spin"/>
                    <span>{bulkActionMessage}</span>
                </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Articles List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="p-4 w-12 text-center">
                  <Checkbox
                    onCheckedChange={handleSelectPage}
                    checked={isAllOnPageSelected}
                    indeterminate={isIndeterminatePageSelection}
                    aria-label="בחר את כל המאמרים בעמוד"
                  />
                </TableHead>
                <TableHead className="p-4 text-right font-semibold">כותרת</TableHead>
                <TableHead className="p-4 text-right font-semibold">עורך</TableHead>
                <TableHead className="p-4 text-right font-semibold">קטגוריה</TableHead>
                <TableHead className="p-4 text-right font-semibold">תאריך</TableHead>
                <TableHead className="p-4 text-right font-semibold">סטטוס</TableHead>
                <TableHead className="p-4 text-right font-semibold">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-8 text-gray-500">
                    <Newspaper className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    לא נמצאו מאמרים
                  </TableCell>
                </TableRow>
              ) : (
                paginatedArticles.map((article) => {
                  const author = users.find(u => u.id === article.author_user_id);
                  // Determine display author name:
                  // 1. Current user's display_name/full_name if assigned_author_id matches a user
                  // 2. Original author name from article.author field
                  // 3. 'לא משויך' if neither
                  const displayAuthorName = author ? (author.display_name || author.full_name) : (article.author || 'לא משויך');

                  return (
                    <ArticleRow
                      key={article.id}
                      article={{
                        ...article,
                        isSelected: selectedArticles.has(article.id), // Pass selection state
                        onSelect: handleSelectArticle, // Pass selection handler
                        displayAuthorName: displayAuthorName, // Pass resolved author name for display
                      }}
                      onUpdateStatus={handleUpdateArticleStatus}
                      onDelete={handleDelete}
                      onReassign={handleReassignSingleArticle}
                      onEditArticle={onEditArticle}
                    />
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-center space-x-2 space-x-reverse">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    הקודם
                </Button>
                <span className="text-sm">
                    עמוד {currentPage} מתוך {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    הבא
                </Button>
            </div>
        )}
      </Card>
    </div>
  );
}