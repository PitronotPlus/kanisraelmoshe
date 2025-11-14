
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/entities/User';
import { Article } from '@/entities/Article';
import { Button } from '@/components/ui/button';
import { Edit, Settings, Home, X, Users, Palette } from 'lucide-react';

export default function AdminToolbar() {
  const [user, setUser] = useState(null);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const currentUser = await User.me();
        if (currentUser && currentUser.role === 'admin') {
          setUser(currentUser);
          
          // Check if we're on an article page - better detection
          const urlParams = new URLSearchParams(window.location.search);
          const articleId = urlParams.get('id');
          const pathname = window.location.pathname;
          
          if (pathname.includes('Article') && articleId) {
            try {
              const article = await Article.get(articleId);
              if (article) {
                setCurrentArticle(article);
              }
            } catch (error) {
              console.error('Error fetching article:', error);
            }
          }
        }
      } catch (error) {
        // User not logged in or not admin, don't show toolbar
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [location]);

  if (loading || !user || user.role !== 'admin' || !isVisible) {
    return null;
  }

  const pathname = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get('id');
  
  const getEditLink = () => {
    if (pathname.includes('Article') && currentArticle) {
      return createPageUrl(`Editor?id=${currentArticle.id}`);
    }
    if (pathname.includes('Home') || pathname === '/') {
      return createPageUrl(`Admin?section=homepage`);
    }
    if (pathname.includes('Category')) {
      const categorySlug = urlParams.get('slug');
      if (categorySlug) {
        return createPageUrl(`Admin?section=categories&edit=${categorySlug}`);
      }
    }
    return createPageUrl('Admin');
  };

  const getEditLabel = () => {
    if (pathname.includes('Article') && currentArticle) {
      return `ערוך: "${currentArticle.title.substring(0, 25)}${currentArticle.title.length > 25 ? '...' : ''}"`;
    }
    if (pathname.includes('Home') || pathname === '/') {
      return 'ערוך דף הבית';
    }
    if (pathname.includes('Category')) {
      return 'ערוך קטגוריה';
    }
    return 'עבור לניהול';
  };

  const canEdit = () => {
    return (pathname.includes('Article') && currentArticle) || 
           pathname.includes('Home') || 
           pathname === '/' ||
           pathname.includes('Category');
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-900 text-white shadow-lg z-[1000] border-b-2 border-blue-500">
      <div className="max-w-full mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">מנהל: {user.full_name}</span>
            </div>
            
            <div className="h-4 w-px bg-gray-600"></div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              {canEdit() ? (
                <Button
                  asChild
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Link to={getEditLink()}>
                    <Edit className="w-4 h-4 ml-2" />
                    {getEditLabel()}
                  </Link>
                </Button>
              ) : (
                <span className="text-gray-400 text-sm px-3 py-1">
                  אין עריכה זמינה לדף זה
                </span>
              )}
              
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white bg-gray-800"
              >
                <Link to={createPageUrl('Admin')}>
                  <Settings className="w-4 h-4 ml-2" />
                  לוח בקרה
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="sm" 
                className="border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white bg-gray-800"
              >
                <Link to={createPageUrl('AdminUsers')}>
                  <Users className="w-4 h-4 ml-2" />
                  משתמשים
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="sm" 
                className="border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white bg-gray-800"
              >
                <Link to={createPageUrl('AdminSettings')}>
                  <Palette className="w-4 h-4 ml-2" />
                  הגדרות
                </Link>
              </Button>
              
              {!pathname.includes('Home') && pathname !== '/' && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-gray-500 text-gray-200 hover:bg-gray-700 hover:text-white bg-gray-800"
                >
                  <Link to={createPageUrl('Home')}>
                    <Home className="w-4 h-4 ml-2" />
                    דף הבית
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
