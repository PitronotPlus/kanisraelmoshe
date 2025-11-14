
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "@/entities/User";
import { Article } from "@/entities/Article";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ShieldX, PenTool, Eye } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpeakerProfileForm from "../components/speakers/SpeakerProfileForm";

export default function SpeakerDashboard() {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser && currentUser.app_role === 'speaker') {
          setUser(currentUser);
          setIsAuthorized(true);
          const userArticles = await Article.filter({ created_by: currentUser.email }, '-created_date');
          setArticles(userArticles);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const handleNewArticle = () => {
    navigate(createPageUrl('Editor'));
  };

  const handleEditArticle = (articleId) => {
    navigate(createPageUrl(`Editor?id=${articleId}`));
  };

  const handleDeleteArticle = async (articleId) => {
    if (confirm("האם למחוק את המאמר? פעולה זו אינה הפיכה.")) {
      try {
        await Article.delete(articleId);
        setArticles(prev => prev.filter(a => a.id !== articleId));
      } catch (error) {
        console.error("Failed to delete article:", error);
        alert("שגיאה במחיקת המאמר.");
      }
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
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
        <p className="text-gray-500 mt-2">עמוד זה מיועד לדוברים בלבד.</p>
        <Link to={createPageUrl('Home')}>
          <Button className="mt-4">חזור לדף הבית</Button>
        </Link>
      </div>
    );
  }

  const stats = {
    total: articles.length,
    published: articles.filter(a => a.published).length,
    totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0)
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-purple-100 p-3 rounded-xl">
            <PenTool className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">פאנל דוברים</h1>
            <p className="text-gray-600">שלום {user.full_name}, נהל את הכתבות והפרופיל שלך.</p>
          </div>
        </div>
        <Button onClick={handleNewArticle} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-5 h-5 ml-2" />
          כתבה חדשה
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader><CardTitle>סך הכתבות</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.total}</CardContent></Card>
        <Card><CardHeader><CardTitle>כתבות שפורסמו</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.published}</CardContent></Card>
        <Card><CardHeader><CardTitle>סה"כ צפיות</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</CardContent></Card>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="articles">הכתבות שלי</TabsTrigger>
          <TabsTrigger value="profile">הפרופיל שלי</TabsTrigger>
        </TabsList>
        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>ניהול כתבות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {articles.length > 0 ? articles.map(article => (
                  <div key={article.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h3 className="font-semibold">{article.title}</h3>
                      <div className="text-sm text-gray-500 flex items-center gap-4 mt-1">
                        <Badge variant={article.published ? "default" : "secondary"}>
                          {article.published ? "פורסם" : "טיוטה"}
                        </Badge>
                        {article.created_date && !isNaN(new Date(article.created_date)) && (
                            <span>נוצר ב: {format(new Date(article.created_date), 'dd/MM/yyyy', { locale: he })}</span>
                        )}
                        <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {article.views || 0}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditArticle(article.id)}><Edit className="w-4 h-4 ml-1" /> ערוך</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteArticle(article.id)}><Trash2 className="w-4 h-4 ml-1" /> מחק</Button>
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-gray-500 py-8">עדיין לא כתבת כלום. זה הזמן להתחיל!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="profile">
            <SpeakerProfileForm user={user} onSaveSuccess={handleProfileUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
