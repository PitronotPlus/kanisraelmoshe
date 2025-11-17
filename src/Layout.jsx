
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Advertisement } from "@/entities/Advertisement";
import { SiteConfig } from "@/entities/SiteConfig";
import { NavigationMenu } from "@/entities/NavigationMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { Search, Menu, X, LogOut, LayoutDashboard, PenTool, CircleUserRound, ChevronDown, Settings } from "lucide-react";
import SmartAdBanner from "./components/ads/SmartAdBanner";

// Helper function to build menu tree
const buildMenuTree = (items, parentId = null) => {
  return items
    .filter(item => item.parentId === parentId)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(item => ({
      ...item,
      children: buildMenuTree(items, item.id),
    }));
};

// Component for rendering a single navigation item (top-level or sub-menu)
const NavMenuItem = ({ item, location }) => {
  const hasChildren = item.children && item.children.length > 0;

  const generateSlug = (name) => {
    if (!name) return '';
    return name.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0590-\u05FF-]/g, '')
      .replace(/--+/g, '-')
      .replace(/-+$/, '');
  };

  const getLink = () => {
    if (item.type === 'category') {
      const slug = item.slug || generateSlug(item.label);
      return createPageUrl(`Category?slug=${slug}`);
    }
    if (item.type === 'custom') {
      return item.url;
    }
    return null;
  };

  // Check if current item is active
  const isActive = () => {
    const pathname = location.pathname.toLowerCase();
    const isHomePage = pathname === '/' || pathname.includes('home');
    
    // Check if this is the "ראשי" category (main/home category)
    const isMainCategory = item.label === 'ראשי' || item.label === 'main' || item.slug === 'main' || item.slug === 'ראשי';
    
    // If we're on home page and this is the main category, mark as active
    if (isHomePage && isMainCategory) {
      return true;
    }
    
    // For custom links, check if the current path matches
    if (item.type === 'custom' && item.url) {
      // Extract the page name from the custom URL
      try {
        const urlMatch = item.url.match(/\/([\w]+)(\?|$)/);
        if (urlMatch && urlMatch[1]) {
          const pageName = urlMatch[1].toLowerCase();
          if (pathname.includes(pageName)) {
            return true;
          }
        }
      } catch (e) {
        // If URL parsing fails, continue with category check
      }
    }
    
    if (item.type === 'category') {
      const slug = item.slug || generateSlug(item.label);
      const urlParams = new URLSearchParams(location.search);
      const currentSlug = urlParams.get('slug');
      const categoryParam = urlParams.get('category');
      
      // Check if we're on the category page itself
      if (currentSlug === slug) return true;
      
      // Check if we're on an article page that belongs to this category
      if (categoryParam === slug) return true;
      
      return false;
    }
    return false;
  };

  const active = isActive();

  if (!hasChildren) {
    if (item.type === 'parent') {
      return (
        <span className="nav-menu-item text-base font-bold text-white cursor-default px-4 py-3 border-r border-white/20">
          {item.label}
        </span>
      );
    }
    
    const link = getLink();
    if (link) {
      return (
        <Link
          to={link}
          className={`nav-menu-item text-base font-bold px-4 py-3 border-r border-white/20 transition-all relative ${
            active ? 'bg-[#d20201] text-white' : 'text-white hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-1 hover:after:bg-[#d20201]'
          }`}
        >
          {item.label}
        </Link>
      );
    }
    return (
      <span className="nav-menu-item text-base font-bold text-white cursor-default px-4 py-3 border-r border-white/20">
        {item.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`nav-menu-item flex items-center text-base font-bold focus:outline-none px-4 py-3 border-r border-white/20 transition-all relative ${
        active ? 'bg-[#d20201] text-white' : 'text-white hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-1 hover:after:bg-[#d20201]'
      }`}>
        {item.label}
        <ChevronDown className="w-4 h-4 mr-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {item.type !== 'parent' && (
          <>
            <DropdownMenuItem asChild>
               <Link to={getLink()} className="font-bold">כל הכתבות ב-{item.label}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {item.children.map(child => <NavSubMenuItem key={child.id} item={child} />)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Component for rendering sub-menu items within dropdowns
const NavSubMenuItem = ({ item }) => {
    const hasChildren = item.children && item.children.length > 0;

    const generateSlug = (name) => {
      if (!name) return '';
      return name.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0590-\u05FF-]/g, '')
        .replace(/--+/g, '-')
        .replace(/-+$/, '');
    };
    
    const getLink = () => {
      if (item.type === 'category') {
        const slug = item.slug || generateSlug(item.label);
        return createPageUrl(`Category?slug=${slug}`);
      }
      if (item.type === 'custom') {
        return item.url;
      }
      return null;
    };

    if (!hasChildren) {
        if (item.type === 'parent') {
            return (
                <DropdownMenuItem disabled>
                    <span className="font-semibold text-gray-600">{item.label}</span>
                </DropdownMenuItem>
            );
        }
        
        const link = getLink();
        if (link) {
            return (
                <DropdownMenuItem asChild>
                    <Link to={link}>{item.label}</Link>
                </DropdownMenuItem>
            );
        }
        return (
            <DropdownMenuItem disabled>
                <span>{item.label}</span>
            </DropdownMenuItem>
        );
    }
    
    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <span>{item.label}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                 {item.type !== 'parent' && (
                   <>
                     <DropdownMenuItem asChild>
                        <Link to={getLink()} className="font-bold">כל הכתבות ב-{item.label}</Link>
                     </DropdownMenuItem>
                     <DropdownMenuSeparator />
                   </>
                 )}
                {item.children.map(child => <NavSubMenuItem key={child.id} item={child} />)}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}

// Admin Toolbar Component
const AdminToolbar = ({ user }) => {
  const location = useLocation();
  
  if (location.pathname.includes('Admin') || 
      location.pathname.includes('Editor') || 
      location.pathname.includes('SpeakerDashboard')) {
    return null;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const getDirectEditLink = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const pathname = location.pathname.toLowerCase();
    
    if (pathname.includes('article') && urlParams.get('id')) {
        const articleId = urlParams.get('id');
        return createPageUrl('Editor', { id: articleId });
    }
    
    if (pathname.includes('home') || pathname === '/') {
        return createPageUrl('Admin', { tab: 'homepage' });
    }
    
    if (pathname.includes('category')) {
        return createPageUrl('Admin', { tab: 'content' });
    }
    
    return null;
  };
  
  const getEditButtonText = () => {
    const pathname = location.pathname.toLowerCase();
    if (pathname.includes('article')) {
        return 'ערוך מאמר זה';
    }
    if (pathname.includes('home') || pathname === '/') {
        return 'ערוך דף הבית';
    }
    if (pathname.includes('category')) {
        return 'ערוך קטגוריה';
    }
    return 'עבור לעריכה';
  };

  const handleDirectEditClick = () => {
      const editLink = getDirectEditLink();
      if (editLink) {
          window.location.href = editLink;
      } else {
          alert('אין אפשרות עריכה ישירה לעמוד זה. ניתן לעבור ללוח הבקרה.');
          window.location.href = createPageUrl('Admin');
      }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-[70px] md:h-[60px] bg-gray-900 text-white flex items-center px-4 md:px-8 z-[1000] shadow-lg">
      <div className="flex-grow flex items-center space-x-4 space-x-reverse text-sm md:text-base">
        <span className="font-bold hidden sm:inline">פאנל ניהול:</span>
        <Link to={createPageUrl('Admin')} className="hover:underline whitespace-nowrap">לוח בקרה</Link>
        <Link to={createPageUrl('Admin', { tab: 'articles' })} className="hover:underline whitespace-nowrap">מאמרים</Link>
        <Link to={createPageUrl('Admin', { tab: 'content' })} className="hover:underline whitespace-nowrap">קטגוריות</Link>
        <Link to={createPageUrl('Admin', { tab: 'users' })} className="hover:underline whitespace-nowrap hidden sm:inline">משתמשים</Link>
        <Link to={createPageUrl('Admin', { tab: 'settings' })} className="hover:underline whitespace-nowrap hidden sm:inline">הגדרות אתר</Link>
        
        <button 
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded ml-auto whitespace-nowrap"
            onClick={handleDirectEditClick}
        >
            {getEditButtonText()}
        </button>
      </div>
    </div>
  );
};


export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allAds, setAllAds] = useState([]); // Changed from headerAds to allAds
  const [siteConfig, setSiteConfig] = useState(null);

  const customFonts = useMemo(() => siteConfig?.custom_fonts || [], [siteConfig]);
  
  const fontLinks = {
    Assistant: "https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&display=swap",
    Heebo: "https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap",
    Arimo: "https://fonts.googleapis.com/css2?family=Arimo:wght@300;400;500;600;700;800&display=swap",
    Rubik: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700;800&display=swap",
    "Open Sans": "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700;800&display=swap"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [currentUser, menuResult, adsData, configData] = await Promise.all([
          User.me().catch(() => null),
          NavigationMenu.filter({ name: 'main_menu' }).catch(() => []),
          Advertisement.filter({ active: true }).catch(() => []), // Load ALL active ads
          SiteConfig.list().catch(() => [])
        ]);
        
        setUser(currentUser);
        if (menuResult.length > 0) {
            const flatItems = menuResult[0].items || [];
            setMenuItems(flatItems);
            setMenuTree(buildMenuTree(flatItems));
        }
        setAllAds(adsData); // Store all ads
        if (configData.length > 0) {
            setSiteConfig(configData[0]);
        } else {
            setSiteConfig({ 
              font_family: 'Assistant', 
              primary_color: '#153b79', 
              accent_color: '#d20201',
              background_color: '#f9fafb',
              text_color_primary: '#111827',
              text_color_secondary: '#6b7281',
              site_description: 'אתר החדשות המוביל בישראל' 
            });
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin' && !user.requested_app_role && user.status !== 'approved' && user.status !== 'rejected') {
        const allowedPaths = ['/onboarding', '/logout'];
        const currentPath = location.pathname.toLowerCase();
        
        if (!allowedPaths.some(path => currentPath === createPageUrl(path.substring(1)))) {
             navigate(createPageUrl('Onboarding'));
        }
    }
  }, [user, location, navigate]);

  const desktopNavigationItems = useMemo(() => {
    return menuTree;
  }, [menuTree]);

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    window.location.href = createPageUrl('Home');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(createPageUrl(`Search?q=${encodeURIComponent(searchQuery.trim())}`));
      setMobileMenuOpen(false);
    }
  };

  const UserMenu = () => {
    if (loading) {
      return <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>;
    }

    if (user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 space-x-reverse px-2">
              <CircleUserRound className="w-7 h-7 text-gray-600" />
              <span className="hidden md:inline">{user.full_name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('UserSettings')} onClick={() => setMobileMenuOpen(false)}>
                <Settings className="w-4 h-4 ml-2" />
                הגדרות פרופיל
              </Link>
            </DropdownMenuItem>
            {user.role === 'admin' && (
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('Admin')} onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4 ml-2" />
                  פאנל ניהול
                </Link>
              </DropdownMenuItem>
            )}
            {user.app_role === 'speaker' && (
              <DropdownMenuItem asChild>
                <Link to={createPageUrl('SpeakerDashboard')} onClick={() => setMobileMenuOpen(false)}>
                  <PenTool className="w-4 h-4 ml-2" />
                  פאנל דוברים
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="w-4 h-4 ml-2" />
              התנתקות
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center space-x-2 space-x-reverse">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => User.login()}
        >
          כניסה
        </Button>
        <Button 
          size="sm"
          onClick={() => User.login()}
        >
          הרשמה
        </Button>
      </div>
    );
  };

  const generateTypographyCSS = () => {
    if (!siteConfig?.typography) return '';
    
    let css = '';
    Object.entries(siteConfig.typography).forEach(([element, styles]) => {
      if (!styles || typeof styles !== 'object') return;
      
      let styleString = '';
      if (styles.fontFamily && typeof styles.fontFamily === 'string') {
        styleString += `font-family: '${styles.fontFamily}', sans-serif !important;`;
      }
      if (styles.fontWeight && (typeof styles.fontWeight === 'number' || typeof styles.fontWeight === 'string')) {
        styleString += `font-weight: ${styles.fontWeight} !important;`;
      }
      if (styles.color && typeof styles.color === 'string') {
        styleString += `color: ${styles.color} !important;`;
      }

      if (styleString) {
        css += `${element} { ${styleString} }`;
      }
    });
    return css;
  };

  const generateCustomFontCSS = () => {
    if (!customFonts || !Array.isArray(customFonts) || customFonts.length === 0) return '';
    
    return customFonts.map(font => {
      if (!font || !font.familyName || !font.files || !Array.isArray(font.files)) return '';
      
      const fontSources = font.files
        .filter(file => file && file.url && file.format)
        .sort((a, b) => {
          const formatPriority = { woff2: 1, woff: 2, ttf: 3, otf: 4, eot: 5 };
          return (formatPriority[a.format] || 6) - (formatPriority[b.format] || 6);
        })
        .map(file => {
          const format = file.format === 'ttf' ? 'truetype' : 
                       file.format === 'otf' ? 'opentype' : 
                       file.format;
          return `url('${file.url}') format('${format}')`;
        }).join(', ');
      
      if (!fontSources) return '';
      
      return `
        @font-face {
          font-family: '${font.familyName}';
          src: ${fontSources};
          font-display: swap;
          font-weight: 100 900;
        }
      `;
    }).join('\n');
  };

  const generateSlugForMobileMenu = (name) => {
    if (!name) return '';
    return name.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0590-\u05FF-]/g, '')
      .replace(/--+/g, '-')
      .replace(/-+$/, '');
  };

  const showAdminToolbarPadding = user?.role === 'admin' && 
                                !location.pathname.includes('Admin') && 
                                !location.pathname.includes('Editor') && 
                                !location.pathname.includes('SpeakerDashboard');

  return (
    <div dir="rtl" style={{ 
        fontFamily: `'${siteConfig?.font_family || 'Assistant'}', sans-serif`,
        '--primary-color': siteConfig?.primary_color || '#153b79',
        '--accent-color': siteConfig?.accent_color || '#d20201',
        '--background-color': siteConfig?.background_color || '#f9fafb',
        '--text-primary': siteConfig?.text_color_primary || '#111827',
        '--text-secondary': siteConfig?.text_color_secondary || '#6b7281',
      }}
      className="min-h-screen bg-[var(--background-color)]"
    >
      <AdminToolbar user={user} />
      
      <style>{`
        .admin-toolbar-active {
          padding-top: 60px;
        }
        
        @media (max-width: 768px) {
          .admin-toolbar-active {
            padding-top: 70px;
          }
        }
        
        .preload-font {
          font-display: swap;
        }

        ${(() => {
          const uniqueFonts = new Set();
          if (siteConfig?.font_family && fontLinks[siteConfig.font_family] && siteConfig.font_family !== 'Assistant') {
            uniqueFonts.add(siteConfig.font_family);
          }
          if (siteConfig?.typography && typeof siteConfig.typography === 'object') {
            Object.values(siteConfig.typography).forEach(styles => {
              if (styles && typeof styles === 'object' && styles.fontFamily && typeof styles.fontFamily === 'string' && fontLinks[styles.fontFamily] && styles.fontFamily !== 'Assistant') {
                uniqueFonts.add(styles.fontFamily);
              }
            });
          }
          return Array.from(uniqueFonts).map(fontFamily => (
            `@import url('${fontLinks[fontFamily]}');`
          )).join('\n');
        })()}
      
        :root {
          --primary-color: ${siteConfig?.primary_color || '#153b79'};
          --accent-color: ${siteConfig?.accent_color || '#d20201'};
          --background-color: ${siteConfig?.background_color || '#f9fafb'};
          --text-primary: ${siteConfig?.text_color_primary || '#111827'};
          --text-secondary: ${siteConfig?.text_color_secondary || '#6b7281'};
        }

        body {
          background-color: var(--background-color);
          color: var(--text-primary);
          font-family: '${siteConfig?.font_family || 'Assistant'}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-wrap: break-word;
          font-display: swap;
          overflow-x: hidden;
        }

        ${generateCustomFontCSS()}
        ${generateTypographyCSS()}

        .max-w-\[1440px\\] {
          width: 100%;
          max-width: min(1440px, 100vw);
          margin: 0 auto;
        }

        .grid {
          overflow: hidden;
        }
        
        .grid > * {
          min-width: 0;
        }

        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        .text-lg {
            line-height: 1.25rem !important;
        }

        .article-content iframe,
        .article-content video,
        .article-content embed {
            max-width: 100%;
            aspect-ratio: 16 / 9;
            height: auto;
            border-radius: 8px;
            margin: 1rem 0;
        }

        .main-header {
          z-index: 50;
          will-change: transform;
        }

        .hero-card {
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          will-change: transform;
        }

        .hero-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .text-shadow {
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }

        .text-shadow-lg {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .section-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #333;
          margin-bottom: 0.75rem;
          display: block;
          text-align: start;
          padding-top: 0.5rem;
          contain: layout style;
        }
        
        .section-title.green { color: #16a344; }
        .section-title.purple { color: #9333ea; }
        .section-title.blue { color: #2563eb; }
        .section-title.red { color: #dc2626; }

        .section-divider {
          border: none;
          height: 4px;
          background-color: var(--primary-color);
          margin: 0 0 1.5rem 0;
          border-radius: 2px;
          width: 100%;
          contain: layout style;
        }

        .section-divider.green { background-color: #16a344; }
        .section-divider.purple { background-color: #9333ea; }
        .section-divider.blue { background-color: #2563eb; }
        .section-divider.red { background-color: #dc2626; }

        .sidebar-section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #374151;
          color: white;
          font-weight: 700;
          font-size: 1rem;
          padding: 0.5rem 0.75rem;
          contain: layout style;
        }

        .sidebar-news-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-top: none;
          contain: layout style;
        }

        .sidebar-news-list li {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .sidebar-news-list li:last-child {
          border-bottom: none;
        }

        .breaking-news-scroll {
          animation: scroll-left 30s linear infinite;
          will-change: transform;
        }

        @keyframes scroll-left {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .breaking-news-container {
          overflow: hidden;
          contain: layout style paint;
        }

        img {
          content-visibility: auto;
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            padding-top: 0.25rem;
          }
          .section-divider {
            height: 3px;
            margin-bottom: 1rem;
          }

          .hero-card h3 {
            font-size: 1rem !important;
          }

          .mobile-menu-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 60;
          }

          .mobile-menu {
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            width: 280px;
            background: white;
            z-index: 70;
            transform: translateX(100%);
            transition: transform 0.3s ease;
          }

          .mobile-menu.open {
            transform: translateX(0);
          }
          
          .hero-card {
            transition: none;
          }
          
          breaking-news-scroll {
            animation-duration: 20s;
          }
        }

        * {
          box-sizing: border-box;
        }
        
        html, body {
          overflow-x: hidden;
          width: 100%;
        }
        
        .overflow-hidden {
          overflow: hidden;
        }

        @media (prefers-reduced-motion: no-preference) {
          .hero-card {
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
        
        .nav-menu-item {
          position: relative;
        }

        .nav-menu-item:first-child {
          border-right: none;
        }
      `}</style>

      <div 
        className={`bg-white ${showAdminToolbarPadding ? 'admin-toolbar-active' : ''}`}
      >
        <header className="main-header">
          {/* Top Video Banner - DESKTOP */}
          <div className="hidden md:block w-full bg-white">
            <div className="w-full px-4">
              <div className="h-16 overflow-hidden">
                <SmartAdBanner ads={allAds} position="header" size="header" />
              </div>
            </div>
          </div>

          {/* Logo and Search Section - DESKTOP */}
          <div className="hidden md:flex items-center justify-between py-4 px-4 bg-white w-full">
            {/* Left Ad Banner */}
            <div className="w-[300px] h-[80px]">
              <SmartAdBanner ads={allAds} position="header_side" size="header" />
            </div>

            <div className="flex flex-col items-center">
              <Link to={createPageUrl("Home")} className="flex-shrink-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dad5fecc4_.png"
                  alt="כאן ישראל"
                  className="w-auto"
                  style={{ height: `${(siteConfig?.logo_height || 64) * 2}px` }}
                />
              </Link>
              {siteConfig?.site_description && (
                  <p className="hidden md:block text-sm md:text-base text-gray-600 mt-1 font-medium">{siteConfig.site_description}</p>
              )}
            </div>

            <div className="w-[300px] flex items-center justify-end space-x-3 space-x-reverse">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative w-full">
                  <Input
                    type="search"
                    placeholder="חיפוש..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </form>
              <UserMenu />
            </div>
          </div>

          {/* Top Header - MOBILE */}
          <div className="md:hidden flex items-center justify-between py-3 px-4 bg-white">
              <div className="flex-shrink-0">
                  <button
                      className="p-2 -mr-2"
                      onClick={() => setMobileMenuOpen(true)}
                  >
                      <Menu className="w-6 h-6 text-gray-600" />
                  </button>
              </div>

              <div className="flex-grow text-center px-2">
                  <Link to={createPageUrl("Home")} className="inline-block">
                      <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dad5fecc4_.png"
                          alt="כאן ישראל"
                          className="w-auto h-12 max-w-full"
                      />
                  </Link>
              </div>

              <div className="flex-shrink-0">
                  <UserMenu />
              </div>
          </div>

          {/* Navigation Menu (Desktop) - Full Width Blue Background */}
          <nav className="hidden md:flex items-center justify-center w-full" style={{ backgroundColor: '#153b79' }}>
            <div className="flex items-center">
              {desktopNavigationItems.map((item) => (
                <NavMenuItem key={item.id} item={item} location={location} />
              ))}
              <Link 
                to={createPageUrl("Advertisers")} 
                className={`text-base font-bold text-white px-4 py-3 transition-all relative ${
                  location.pathname.toLowerCase().includes('advertisers') 
                    ? 'bg-[#d20201]' 
                    : 'hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:right-0 hover:after:h-1 hover:after:bg-[#d20201]'
                }`}
              >
                פרסם אצלנו
              </Link>
            </div>
          </nav>
        </header>

        <main className="w-full px-4 py-4 md:py-8">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div
          className="mobile-menu-overlay md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className={`mobile-menu md:hidden ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">תפריט</h2>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-4">
          {menuItems
            .filter(item => !item.parentId)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((item) => {
              const link = item.type === 'category' 
                ? createPageUrl(`Category?slug=${item.slug || generateSlugForMobileMenu(item.label)}`) 
                : (item.type === 'custom' ? item.url : null);
              
              if (item.type === 'parent') {
                return (
                  <div
                    key={item.id}
                    className="block py-3 px-2 text-lg font-semibold text-gray-700 border-b border-gray-100 cursor-default"
                  >
                    {item.label}
                  </div>
                );
              }

              if (link) {
                return (
                  <Link
                    key={item.id}
                    to={link}
                    className={`block py-3 px-2 text-lg font-semibold transition-colors border-b border-gray-100`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <div
                  key={item.id}
                  className="block py-3 px-2 text-lg font-semibold text-gray-700 border-b border-gray-100 cursor-default"
                >
                  {item.label}
                </div>
              );
            })}
          <Link
              to={createPageUrl("Advertisers")}
              className="block py-3 px-2 text-lg font-semibold transition-colors border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
          >
              פרסם אצלנו
          </Link>

          {user && (
             <Link
                to={createPageUrl("UserSettings")}
                className="block py-3 px-2 text-lg font-semibold transition-colors border-b border-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                הגדרות פרופיל
              </Link>
          )}

          {user && user.role === 'admin' && (
            <Link
              to={createPageUrl("Admin")}
              className="block py-3 px-2 text-lg font-semibold transition-colors border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              פאנל ניהול
            </Link>
          )}
          {user && user.app_role === 'speaker' && (
            <Link
              to={createPageUrl("SpeakerDashboard")}
              className="block py-3 px-2 text-lg font-semibold transition-colors border-b border-gray-100"
              onClick={() => setMobileMenuOpen(false)}
            >
              פאנל דוברים
            </Link>
          )}
        </nav>
      </div>

      <footer className="bg-gray-800 text-white mt-12 w-full">
        <div className="w-full px-4 py-8 md:py-10">
          <div className="text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dad5fecc4_.png"
              alt="כאן ישראל"
              className="h-16 md:h-20 w-auto mb-4 filter brightness-0 invert mx-auto"
            />
            <p className="text-gray-400 text-sm mb-6">
              {siteConfig?.site_description || 'אתר החדשות המוביל בישראל.'}
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <a href="#" className="text-gray-400 hover:text-white text-sm">אודות</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">צור קשר</a>
              <Link to={createPageUrl("Advertisers")} className="text-gray-400 hover:text-white text-sm">פרסם אצלנו</Link>
              <Link to={createPageUrl("Privacy")} className="text-gray-400 hover:text-white text-sm">מדיניות פרטיות</Link>
              <Link to={createPageUrl("Terms")} className="text-gray-400 hover:text-white text-sm">תקנון</Link>
            </div>
          </div>
          
          <div className="my-8">
            <div className="max-w-[728px] h-24 mx-auto">
              <SmartAdBanner ads={allAds} position="footer" size="banner" />
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-gray-400">
             <div className="max-w-3xl mx-auto text-xs">
                <h4 className="font-bold text-gray-200 mb-2">סעיף 27א – "יצירות שבעל הזכות בהן אינו ידוע או לא אותר"</h4>
                <p>
                    מערכת בלוג | אתר "כאן ישראל " פועלת בכל השקידה הסבירה לגילוי או איתור בעל הזכות של יצירה, תמונה או מאמר. השימוש ביצירה בבלוג זה, נעשה לפי סעיף זה 27א' לחוק זכויות יוצרים. בכל מקרה, בעל הזכות מתבקש לפנות למייל; kanisraelnews@gmail.com ולהודיענו על כך. אנו נפעל להסרה תוך 30 יום מקבלת התלונה למייל זה.
                </p>
             </div>
          </div>
          
          <div className="border-t border-gray-700 mt-6 md:mt-8 pt-4 md:pt-6 text-center text-gray-500 text-xs md:text-sm">
            <p>&copy; {new Date().getFullYear()} כל הזכויות שמורות לקבוצת כאן ישראל.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
