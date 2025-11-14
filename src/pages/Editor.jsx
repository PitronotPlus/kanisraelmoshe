
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Article } from "@/entities/Article";
import { Category } from "@/entities/Category"; // Import the Category entity
import AdminEditor from "../components/admin/AdminEditor";
import CategorySelector from '../components/admin/CategorySelector'; // Import the new CategorySelector component
import { ShieldX } from "lucide-react";

// Shadcn UI imports for Tabs, Cards, and Button
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EditorPage() {
  const [user, setUser] = useState(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [allCategories, setAllCategories] = useState([]); // State to store all available categories
  
  const location = useLocation();
  const navigate = useNavigate();
  const articleId = new URLSearchParams(location.search).get("id");

  useEffect(() => {
    const initialize = async () => {
      setLoading(true); // Start loading indicator
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        let fetchedArticleData = null;
        if (articleId) {
          // Editing existing article
          fetchedArticleData = await Article.get(articleId);
          // Ensure categories object exists, initialize if not
          if (!fetchedArticleData.categories) {
            fetchedArticleData.categories = { primary: '', secondary: [] };
          }
        } else {
          // Creating new article: Initialize with default structure
          fetchedArticleData = {
            title: '',
            content: '',
            categories: { primary: '', secondary: [] },
            status: 'draft', // Default status for a new article
          };
        }
        
        // Load all categories for the selector
        const categoriesData = await Category.list('sort_order');
        setAllCategories(categoriesData);

        // If user is restricted, ensure their article doesn't have disallowed categories selected
        if (currentUser.role !== 'admin' && currentUser.allowed_categories?.length > 0) {
            const allowedSlugs = new Set(currentUser.allowed_categories);
            let primary = fetchedArticleData.categories.primary;
            let secondary = fetchedArticleData.categories.secondary;

            if (primary && primary !== null && primary !== undefined && !allowedSlugs.has(primary)) {
                primary = ''; // Clear invalid primary category
            }
            secondary = secondary.filter(slug => allowedSlugs.has(slug));
            
            fetchedArticleData.categories = { primary, secondary };
        }

        setArticle(fetchedArticleData); // Set the article state

        // Authorization check after user and article data are loaded
        let authorized = false;
        if (articleId) {
          // Editing existing article: admin or author
          // Admins and authors (based on created_by email) are authorized.
          // Also, if the user auto_approves posts, they can edit their own.
          if (currentUser.role === 'admin' || fetchedArticleData.created_by === currentUser.email) {
            authorized = true;
          }
        } else {
          // Creating new article: admin or speaker.
          // If a speaker, they must have auto_approve_posts or their posts will be pending approval.
          if (currentUser.role === 'admin' || currentUser.app_role === 'speaker') {
            authorized = true;
          }
        }
        setIsAuthorized(authorized);

      } catch (error) {
        console.error("Initialization error:", error);
        setIsAuthorized(false);
        alert("שגיאה בטעינת הנתונים. אנא נסה שוב.");
      } finally {
        setLoading(false); // End loading indicator
      }
    };
    initialize();
  }, [articleId]); // Re-run effect if articleId changes

  // Memoize the list of categories available to the current user
  const categoriesForSelector = useMemo(() => {
    if (!user || !allCategories) return [];
    
    // Admins see all categories
    if (user.role === 'admin') {
      return allCategories;
    }

    // Users with no restrictions see all categories
    if (!user.allowed_categories || user.allowed_categories.length === 0) {
      return allCategories;
    }

    // Filter categories for restricted users
    const allowedSlugs = new Set(user.allowed_categories);
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));
    const finalSlugs = new Set();

    allCategories.forEach(cat => {
        if (allowedSlugs.has(cat.slug)) {
            finalSlugs.add(cat.slug);
            // Add all parents to ensure the tree structure is visible
            let current = cat;
            while (current.parent_id) {
                const parent = categoryMap.get(current.parent_id);
                if (parent) {
                    finalSlugs.add(parent.slug);
                    current = parent;
                } else {
                    break;
                }
            }
        }
    });
    
    return allCategories.filter(cat => finalSlugs.has(cat.slug));
  }, [user, allCategories]);

  const handleSaveComplete = (savedArticle) => {
    // Navigate based on the final status of the article
    if (savedArticle.status === 'pending_approval') {
      alert("המאמר נשלח לאישור המערכת.");
    } else if (savedArticle.status === 'published') {
      alert("המאמר פורסם בהצלחה!");
    } else {
      alert("המאמר נשמר כטיוטה.");
    }

    if (user?.role === 'admin') {
      navigate(createPageUrl('Admin?tab=articles')); // Navigate to Admin articles tab
    } else if (user?.app_role === 'speaker') {
      navigate(createPageUrl('SpeakerDashboard')); // Navigate to Speaker Dashboard
    } else {
      navigate(createPageUrl('Home')); // Default navigation
    }
  };

  const handleSave = async (publish) => {
    if (!article || !user) {
      alert("אין מאמר או משתמש לשמירה.");
      return;
    }

    // Validation logic
    if (!article.title || article.title.trim() === '') {
      alert("חובה למלא כותרת.");
      return;
    }
    if (!article.content || article.content.trim() === '') {
      alert("חובה למלא תוכן.");
      return;
    }
    if (!article.categories || !article.categories.primary) {
        alert("חובה לבחור קטגוריה ראשית.");
        return;
    }

    setLoading(true); // Indicate saving in progress
    try {
      let finalStatus = 'draft';
      if (publish) {
        // If 'publish' is true, determine final status based on user role/permissions
        if (user.role === 'admin' || user.auto_approve_posts) {
          finalStatus = 'published';
        } else {
          finalStatus = 'pending_approval';
        }
      }

      const articleToSave = { ...article, status: finalStatus };
      let savedArticle;
      if (article.id) { // Check if article has an ID (exists in DB)
        savedArticle = await Article.update(article.id, articleToSave);
      } else {
        // For new articles, ensure author details from the current user are set
        articleToSave.author_user_id = user.id;
        articleToSave.author = user.display_name || user.full_name;
        articleToSave.author_image = user.profile_image_url;
        articleToSave.author_bio = user.bio;
        savedArticle = await Article.create(articleToSave); // Use Article.create for new articles
      }
      setArticle(savedArticle); // Update state with the newly saved/updated article (e.g., gets an ID if new)
      handleSaveComplete(savedArticle); // Navigate user after successful save
    } catch (error) {
      console.error("שגיאה בשמירת המאמר:", error);
      alert(`שגיאה בשמירת המאמר: ${error.message || "נסה שוב."}`);
    } finally {
      setLoading(false); // End saving indicator
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <ShieldX className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">אין לך הרשאה לגשת לעמוד זה</h2>
      </div>
    );
  }

  const needsApproval = user && user.role !== 'admin' && !user.auto_approve_posts;
  const publishButtonText = needsApproval ? "שלח לאישור" : "שמור ופרסם";

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">{articleId ? "עריכת מאמר" : "יצירת מאמר חדש"}</h1>
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">תוכן</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
          <TabsTrigger value="publish">פרסום</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>תוכן המאמר</CardTitle>
              <CardDescription>כותרת ותוכן המאמר.</CardDescription>
            </CardHeader>
            <CardContent>
              {article && ( // Only render AdminEditor if article state is initialized
                <AdminEditor
                  editingArticle={article}
                  // AdminEditor is now a controlled component, it reports changes via onArticleChange
                  onArticleChange={setArticle} 
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>קטגוריות</CardTitle>
              <CardDescription>שייך את המאמר לקטגוריה ראשית ומספר קטגוריות משניות.</CardDescription>
            </CardHeader>
            <CardContent>
              {article && ( // Only render CategorySelector if article state is initialized
                <CategorySelector
                  allCategories={categoriesForSelector}
                  selected={article.categories}
                  onChange={(newCategories) => setArticle(prev => ({ ...prev, categories: newCategories }))}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="publish">
          <Card>
            <CardHeader>
              <CardTitle>אפשרויות פרסום</CardTitle>
              <CardDescription>נהל את סטטוס הפרסום של המאמר.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>סטטוס נוכחי: <strong>{article?.status === 'published' ? 'פורסם' : (article?.status === 'pending_approval' ? 'ממתין לאישור' : 'טיוטה')}</strong></p>
              <Button onClick={() => handleSave(true)} disabled={loading || !article} className="w-full">{publishButtonText}</Button>
              <Button variant="secondary" onClick={() => handleSave(false)} disabled={loading || !article} className="w-full">שמור טיוטה</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
