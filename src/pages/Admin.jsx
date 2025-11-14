
import React, { useState, useEffect, useMemo } from "react";
import { Article } from "@/entities/Article";
import { Advertisement } from "@/entities/Advertisement";
import { User } from "@/entities/User";
import { Category } from "@/entities/Category";
import { SiteConfig } from "@/entities/SiteConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, LayoutDashboard, Video, Image, Code, Newspaper, BarChart3, Users, Tags, Upload, X, GripVertical, Menu, Home, FileText, Palette, Zap, Shield, PenTool, Trash2, Wrench, Archive, ListTree, Wand2, Copy, Edit, PenSquare, ShieldAlert, FolderTree, PanelLeft } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { createArticleContent } from "@/functions/createArticleContent";
import { UploadFile } from "@/integrations/Core";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Removed Shadcn UI Tabs imports as per outline:
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Import internal admin components
import AdminEditor from "../components/admin/AdminEditor";
import AdminAdvertisers from "../components/admin/AdminAdvertisers";
import UserManagement from "../components/admin/AdminUserManagement"; // Renamed AdminUserManagement to UserManagement for consistency
import WordpressImporter from "../components/admin/WordpressImporter";
import ArticleManagement from "../components/admin/ArticleManagement";
import HomePageEditor from "../components/admin/HomePageEditor";
import SidebarEditor from "../components/admin/SidebarEditor";
// import HotArticlesManager from "../components/admin/HotArticlesManager"; // Removed as per outline
import ImageOptimizationManager from "../components/admin/ImageOptimizationManager";
import ImageRepairManager from "../components/admin/ImageRepairManager";
import BackupManager from "../components/admin/BackupManager";
import MenuEditor from "../components/admin/MenuEditor";
import ImageGenerator from "../components/admin/ImageGenerator";
import DuplicateManager from "../components/admin/DuplicateManager";
import DesignEditor from "../components/admin/DesignEditor";
import ArticleStylist from "../components/admin/ArticleStylist";
import CodeInjectorManager from "../components/admin/CodeInjectorManager";
// import CategoryPageEditor from "../components/admin/CategoryManager"; // Moved to CategoryManager
import ContentCreatorsManager from "../components/admin/ContentCreatorsManager";
import ThinContentManager from "../components/admin/ThinContentManager";
import CategoryManager from "../components/admin/CategoryManager"; // Added new CategoryManager component
import BannerManager from "../components/admin/BannerManager"; // Add new import

// Modern Stats Card Component
const ModernStatsCard = ({ title, value, icon: Icon, gradient, change }) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
    <CardContent className="p-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className="text-sm text-green-600 mt-1">+{change}% מהחודש הקודם</p>
          )}
        </div>
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Modern Content Container
const ContentContainer = ({ children, title, description }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    {title && (
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        {description && <p className="text-gray-600 mt-2">{description}</p>}
      </div>
    )}
    <div className="p-8">
      {children}
    </div>
  </div>
);

export default function Admin() {
  const [stats, setStats] = useState({ articles: 0, ads: 0, users: 0, categories: 0 });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [config, setConfig] = useState(null);
  const [allCategories, setAllCategories] = useState([]); // Kept for passing to CategoryManager
  // Removed newCategory, editingCategory, selectedCategories, showBulkActions states (moved to CategoryManager)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Renamed from isAuthorized
  const navigate = useNavigate();

  // New state for managing article editor view
  const [showArticleEditor, setShowArticleEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);

  // Removed generateSlug as it's now internal to CategoryManager

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const user = await User.me();
        if (user && user.role === 'admin') {
          setIsAdmin(true); // Renamed from setIsAuthorized
          const [articleData, adData, userData, categoryData, siteConfigData] = await Promise.all([
              Article.list(),
              Advertisement.list(),
              User.list(),
              Category.list('sort_order'),
              SiteConfig.list()
          ]);

          if (siteConfigData.length > 0) {
            setConfig(siteConfigData[0]);
          } else {
            const defaultConfig = await SiteConfig.create({
                site_name: "כאן ישראל",
                site_description: "אתר החדשות המוביל בישראל",
                show_video: true,
                video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                video_title: "הצגה ישראלית - סטייטיק לייף בעצמאות 75",
                show_ali_express: true,
                show_ad_sense: true,
                ad_sense_code: "",
                primary_color: "#2563eb",
                accent_color: "#dc2626",
                background_color: "#f9fafb",
                text_color_primary: "#111827",
                text_color_secondary: "#6b7281",
                font_family: "Assistant",
                logo_height: 64,
                typography: {},
                custom_fonts: []
            });
            setConfig(defaultConfig);
          }

          setStats({ articles: articleData.length, ads: adData.length, users: userData.length, categories: categoryData.length });
          setAllCategories(categoryData); // Kept to pass to CategoryManager
        } else {
          setIsAdmin(false); // Renamed from setIsAuthorized
          window.location.href = createPageUrl('Home');
        }
      } catch (error) {
        console.error('Authentication or data fetching error:', error);
        setIsAdmin(false); // Renamed from setIsAuthorized
        window.location.href = createPageUrl('Home');
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndFetchData();
  }, []);
  
  // Add effect to handle direct editing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const editId = urlParams.get('edit');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    // If we have an edit parameter and we're on articles tab, auto-open editor
    if (tab === 'articles' && editId) {
      // Wait for articles to load, then find and edit the article
      const findAndEditArticle = async () => {
        try {
          const article = await Article.filter({ id: editId });
          if (article.length > 0) {
            setEditingArticle(article[0]);
            setShowArticleEditor(true);
          }
        } catch (error) {
          console.error('Error loading article for editing:', error);
        }
      };
      findAndEditArticle();
    }
  }, []);

  const handleEditArticle = (article) => {
    setEditingArticle(article);
    setShowArticleEditor(true);
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setShowArticleEditor(true);
  };

  const handleEditorSaveComplete = () => {
    setShowArticleEditor(false);
    setEditingArticle(null);
  };

  const handleSaveSettings = async () => {
    if (!config || !config.id) {
        alert("שגיאה: לא נמצאה תצורת אתר.");
        return;
    }
    try {
        await SiteConfig.update(config.id, config);
        alert("הגדרות נשמרו בהצלחה!");
    } catch(e) {
        console.error("Failed to save settings", e);
        alert("שגיאה בשמירת ההגדרות.");
    }
  };
  
  // Removed all category management functions (moved to CategoryManager)

  const handleGenerateContent = async () => {
    if (!confirm("פעולה זו תיצור תוכן חדש עבור כל המאמרים שאין להם תוכן ארוך. התהליך עשוי לארוך מספר דקות. האם להמשיך?")) {
        return;
    }
    setIsGeneratingContent(true);
    setGenerationResult(null);
    try {
        const { data } = await createArticleContent();
        if (data.success) {
            setGenerationResult({ success: true, message: data.message });
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Content generation failed:", error);
        setGenerationResult({ success: false, message: `שגיאה ביצירת התוכן: ${error.message}` });
    } finally {
        setIsGeneratingContent(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-700 font-medium">טוען פאנל ניהול...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) { // Renamed from !isAuthorized
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center">
          <Shield className="w-20 h-20 text-red-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">גישה מוגבלת</h2>
          <p className="text-lg text-gray-600">אין לך הרשאה לגשת לפאנל הניהול</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">פאנל ניהול</h1>
                <p className="text-sm text-gray-500">ממשק ניהול מתקדם</p>
              </div>
            </div>
            <Link
              to={createPageUrl('Home')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg text-sm font-medium"
            >
              <Home className="w-4 h-4 inline ml-2" />
              צפה באתר
            </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-2 space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>לוח בקרה</span>
              </button>
              
              <button
                onClick={() => setActiveTab('articles')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'articles' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span>ניהול מאמרים</span>
              </button>
              
              <button
                onClick={() => setActiveTab('creators')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'creators' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <PenSquare className="w-4 h-4" />
                <span>ניהול כותבים</span>
              </button>
              
              <button
                onClick={() => setActiveTab('content')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'content' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <FolderTree className="w-4 h-4" />
                <span>ניהול קטגוריות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('homepage')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'homepage' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>עורך דף הבית</span>
              </button>
              
              <button
                onClick={() => setActiveTab('sidebar')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'sidebar' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <PanelLeft className="w-4 h-4" />
                <span>עורך סרגל צד</span>
              </button>
              
              <button
                onClick={() => setActiveTab('menu')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'menu' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <ListTree className="w-4 h-4" />
                <span>ניהול תפריט</span>
              </button>
              
              <button
                onClick={() => setActiveTab('ads')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'ads' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>ניהול פרסום</span>
              </button>
              
              <button
                onClick={() => setActiveTab('banners')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'banners' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>ניהול באנרים</span>
              </button>

              <button
                onClick={() => setActiveTab('import')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'import' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>ייבוא תוכן</span>
              </button>
              
              <button
                onClick={() => setActiveTab('images')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'images' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>אופטימיזציית תמונות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('image-repair')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'image-repair' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>תיקון תמונות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('image-generator')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'image-generator' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>מחולל תמונות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('duplicates')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'duplicates' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Copy className="w-4 h-4" />
                <span>זיהוי כפילויות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('thin-content')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'thin-content' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>מנהל תוכן דל</span>
              </button>
              
              <button
                onClick={() => setActiveTab('backup')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'backup' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>גיבוי וקבצים</span>
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'users' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>ניהול משתמשים</span>
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'settings' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>הגדרות</span>
              </button>
              
              <button
                onClick={() => setActiveTab('design')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'design' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>צבעים וטיפוגרפיה</span>
              </button>
              
              <button
                onClick={() => setActiveTab('article-stylist')}
                className={`w-full text-right px-4 py-3 rounded-lg transition-colors flex items-center space-x-3 space-x-reverse ${
                  activeTab === 'article-stylist' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Wand2 className="w-4 h-4" />
                <span>מסגנן מאמרים</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="text-center lg:text-right">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">ברוכים הבאים לפאנל הניהול</h1>
                  <p className="text-xl text-gray-600">נהל את האתר שלך בקלות ויעילות</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <ModernStatsCard title="סה״כ מאמרים" value={stats.articles} icon={FileText} gradient="from-blue-500 to-blue-600" change={12}/>
                  <ModernStatsCard title="קטגוריות" value={stats.categories} icon={Tags} gradient="from-purple-500 to-purple-600" change={8}/>
                  <ModernStatsCard title="מודעות פעילות" value={stats.ads} icon={BarChart3} gradient="from-green-500 to-green-600" change={15}/>
                  <ModernStatsCard title="משתמשים" value={stats.users} icon={Users} gradient="from-red-500 to-red-600" change={5}/>
                </div>

                <ContentContainer title="פעולות מהירות" description="גישה מהירה לפעולות הנפוצות ביותר">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button onClick={() => setActiveTab('articles')} className="h-16 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg rounded-xl">
                      <FileText className="w-5 h-5 ml-2" />
                      ניהול מאמרים
                    </Button>
                    <Button onClick={() => setActiveTab('content')} className="h-16 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg rounded-xl">
                      <Tags className="w-5 h-5 ml-2" />
                      ניהול קטגוריות
                    </Button>
                    <Button onClick={() => setActiveTab('users')} className="h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg rounded-xl">
                      <Users className="w-5 h-5 ml-2" />
                      ניהול משתמשים
                    </Button>
                  </div>
                </ContentContainer>

                <ContentContainer title="כלי תוכן חכם" description="השתמש בבינה מלאכותית ליצירת תוכן איכותי">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-indigo-900 mb-2">יצירת תוכן באמצעות AI</h4>
                        <p className="text-indigo-700">צור תוכן איכותי עבור מאמרים חדשים או קיימים</p>
                      </div>
                      <Button onClick={handleGenerateContent} disabled={isGeneratingContent} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg px-6 py-3 rounded-xl">
                        {isGeneratingContent ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                            יוצר תוכן...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 ml-2" />
                            צור תוכן חכם
                          </>
                        )}
                      </Button>
                    </div>
                    {generationResult && (
                      <div className={`mt-4 p-4 rounded-lg ${generationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {generationResult.message}
                      </div>
                    )}
                  </div>
                </ContentContainer>
              </div>
            )}

            {activeTab === 'articles' && (
              <ContentContainer title="ניהול מאמרים" description="צור, ערוך ונהל את כל המאמרים באתר">
                {showArticleEditor ? (
                  <AdminEditor
                    editingArticle={editingArticle}
                    onSaveComplete={handleEditorSaveComplete}
                    onArticleChange={() => {}}
                    onBack={handleEditorSaveComplete}
                  />
                ) : (
                  <ArticleManagement
                    onEditArticle={handleEditArticle}
                    onNewArticle={handleNewArticle}
                  />
                )}
              </ContentContainer>
            )}

            {activeTab === 'creators' && (
              <ContentContainer title="ניהול כותבים" description="נהל כותבים ותרומות תוכן">
                <ContentCreatorsManager />
              </ContentContainer>
            )}
            
            {activeTab === 'content' && (
                <ContentContainer title="ניהול קטגוריות" description="צור, ערוך וסדר את כל הקטגוריות באתר">
                    <CategoryManager
                      allCategories={allCategories}
                      setAllCategories={setAllCategories}
                      stats={stats}
                      setStats={setStats}
                    />
                </ContentContainer>
            )}

            {activeTab === 'homepage' && (
              <ContentContainer title="עריכת דף הבית" description="התאם את מראה ותוכן דף הבית">
                <HomePageEditor />
              </ContentContainer>
            )}

            {activeTab === 'sidebar' && (
              <ContentContainer title="עריכת סרגל צד" description="נהל את הרכיבים בסרגל הצד">
                <SidebarEditor />
              </ContentContainer>
            )}

            {activeTab === 'menu' && (
              <ContentContainer title="ניהול תפריט" description="סדר והגדר את תפריט הניווט הראשי של האתר">
                <MenuEditor />
              </ContentContainer>
            )}

            {activeTab === 'ads' && (
              <ContentContainer title="ניהול פרסום" description="נהל מודעות וקמפיינים פרסומיים">
                <AdminAdvertisers />
              </ContentContainer>
            )}

            {activeTab === 'banners' && (
              <ContentContainer title="ניהול באנרים ופרסומות" description="נהל באנרים, מודעות וידאו ופרסומות באתר">
                <BannerManager />
              </ContentContainer>
            )}

            {activeTab === 'import' && (
              <ContentContainer title="ייבוא תוכן" description="ייבא מאמרים מקבצי CSV או מקורות חיצוניים">
                <WordpressImporter />
              </ContentContainer>
            )}

            {activeTab === 'images' && (
              <ContentContainer title="אופטימיזציית תמונות" description="שפר את ביצועי התמונות באתר">
                <ImageOptimizationManager />
              </ContentContainer>
            )}

            {activeTab === 'image-repair' && (
              <ContentContainer title="תיקון קישורי תמונות" description="העבר תמונות חיצוניות ממאמרים לשרת המקומי">
                <ImageRepairManager />
              </ContentContainer>
            )}

            {activeTab === 'image-generator' && (
              <ContentContainer title="מחולל תמונות" description="צור תמונות אוטומטיות למאמרים ללא תמונות">
                <ImageGenerator />
              </ContentContainer>
            )}

            {activeTab === 'duplicates' && (
              <ContentContainer title="זיהוי כפילויות" description="מצא ומחק מאמרים כפולים באתר">
                <DuplicateManager />
              </ContentContainer>
            )}

            {activeTab === 'thin-content' && (
              <ContentContainer title="מנהל תוכן דל" description="מצא ונקה מאמרים עם תוכן מועט או חסר">
                <ThinContentManager />
              </ContentContainer>
            )}

            {activeTab === 'backup' && (
              <ContentContainer title="גיבוי וניהול קבצים" description="ייצא מאמרים ונהל קבצי תמונות באתר">
                <BackupManager />
              </ContentContainer>
            )}

            {activeTab === 'users' && (
              <ContentContainer title="ניהול משתמשים" description="נהל הרשאות ואשר משתמשים חדשים">
                <UserManagement />
              </ContentContainer>
            )}

            {activeTab === 'settings' && (
              <ContentContainer title="הגדרות מערכת" description="קבע את ההגדרות הכלליות של האתר">
                <div className="space-y-6">
                  <Card className="shadow-lg border-0 rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white py-4 rounded-t-2xl">
                      <CardTitle className="flex items-center space-x-2 space-x-reverse text-blue-700">
                        <LayoutDashboard className="w-5 h-5" />
                        <span>הגדרות כלליות</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>שם האתר</Label>
                          <Input
                            value={config?.site_name || ''}
                            onChange={(e) => setConfig(prev => ({...prev, site_name: e.target.value}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>תיאור האתר</Label>
                          <Textarea
                            value={config?.site_description || ''}
                            onChange={(e) => setConfig(prev => ({...prev, site_description: e.target.value}))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <CodeInjectorManager
                    config={config}
                    onConfigChange={setConfig}
                  />

                  <Card className="shadow-lg border-0 rounded-2xl">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white py-4 rounded-t-2xl">
                      <CardTitle className="flex items-center space-x-2 space-x-reverse text-blue-700">
                        <Settings className="w-5 h-5" />
                        <span>שמירת שינויים</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Button onClick={handleSaveSettings} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        שמור את כל ההגדרות
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </ContentContainer>
            )}
            
            {activeTab === 'design' && (
                <ContentContainer title="צבעים וטיפוגרפיה" description="התאם את העיצוב הויזואלי של האתר">
                  <DesignEditor
                    config={config}
                    onConfigChange={setConfig}
                    onSave={handleSaveSettings}
                  />
                </ContentContainer>
            )}

            {activeTab === 'article-stylist' && (
              <ContentContainer title="מסגנן מאמרים" description="עיצוב אוטומטי של מאמרים - הפרדת פסקאות ועיצוב מקצועי">
                <ArticleStylist />
              </ContentContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
