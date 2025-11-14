
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/entities/User";
import { Advertisement } from "@/entities/Advertisement";
import { SiteConfig } from "@/entities/SiteConfig"; // Corrected import statement
import { NavigationMenu } from "@/entities/NavigationMenu"; // Import new entity
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
const NavMenuItem = ({ item }) => {
  const hasChildren = item.children && item.children.length > 0;

  const generateSlug = (name) => {
    if (!name) return '';
    return name.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0590-\u05FF-]/g, '') // Keep Hebrew characters
      .replace(/--+/g, '-')
      .replace(/-+$/, '');
  };

  const getLink = () => {
    if (item.type === 'category') {
      // Use slug if available, otherwise generate from label
      const slug = item.slug || generateSlug(item.label);
      return createPageUrl(`Category?slug=${slug}`);
    }
    if (item.type === 'custom') { // Added as per outline
      return item.url;
    }
    // Parent items don't have links or other items that are not meant to be direct links
    return null; // Changed as per outline
  };

  if (!hasChildren) {
    // If it's a parent type, render as non-clickable text
    if (item.type === 'parent') { // Added as per outline
      return (
        <span className="text-lg font-semibold text-gray-700 cursor-default">
          {item.label}
        </span>
      );
    }
    
    // Regular clickable item - only if there's a valid link
    const link = getLink();
    if (link) {
      return (
        <Link
          to={link}
          className="text-lg font-semibold transition-colors hover:text-[var(--primary-color)] text-gray-700"
        >
          {item.label}
        </Link>
      );
    }
    // Fallback for items without a link but not explicitly 'parent' type
    return (
      <span className="text-lg font-semibold text-gray-700 cursor-default">
        {item.label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center text-lg font-semibold transition-colors hover:text-[var(--primary-color)] text-gray-700 focus:outline-none">
        {item.label}
        <ChevronDown className="w-4 h-4 mr-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {/* Only show "view all" link if it's not a parent type */}
        {item.type !== 'parent' && ( // Added condition as per outline
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
        .replace(/[^\w\u0590-\u05FF-]/g, '') // Keep Hebrew characters
        .replace(/--+/g, '-')
        .replace(/-+$/, '');
    };
    
    const getLink = () => {
      if (item.type === 'category') {
        const slug = item.slug || generateSlug(item.label);
        return createPageUrl(`Category?slug=${slug}`);
      }
      if (item.type === 'custom') { // Added as per outline
        return item.url;
      }
      return null; // Changed as per outline
    };

    if (!hasChildren) {
        // If it's a parent type, render as non-clickable
        if (item.type === 'parent') { // Added as per outline
            return (
                <DropdownMenuItem disabled>
                    <span className="font-semibold text-gray-600">{item.label}</span>
                </DropdownMenuItem>
            );
        }
        
        // Regular clickable item - only if there's a valid link
        const link = getLink();
        if (link) {
            return (
                <DropdownMenuItem asChild>
                    <Link to={link}>{item.label}</Link>
                </DropdownMenuItem>
            );
        }
        // Fallback for items without a link but not explicitly 'parent' type
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
                 {/* Only show "view all" link if it's not a parent type */}
                 {item.type !== 'parent' && ( // Added condition as per outline
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
  
  // Don't show toolbar in admin pages or editor pages
  if (location.pathname.includes('Admin') || 
      location.pathname.includes('Editor') || 
      location.pathname.includes('SpeakerDashboard')) {
    return null;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  // Determine current page type for direct editing button
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
        // categorySlug not used for direct link, leads to general category admin
        return createPageUrl('Admin', { tab: 'content' });
    }
    
    // No specific edit available for this page
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
  const [menuItems, setMenuItems] = useState([]); // State for flat menu items
  const [menuTree, setMenuTree] = useState([]); // State for hierarchical menu
  const [searchQuery, setSearchQuery] = useState("");
  const [headerAds, setHeaderAds] = useState([]);
  const [siteConfig, setSiteConfig] = useState(null);

  // Custom fonts are now derived from siteConfig, not separate state
  const customFonts = useMemo(() => siteConfig?.custom_fonts || [], [siteConfig]);
  
  // Define font links with extended weights within the component as per outline
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
          Advertisement.filter({ position: 'header', active: true }).catch(() => []),
          SiteConfig.list().catch(() => [])
        ]);
        
        setUser(currentUser);
        if (menuResult.length > 0) {
            const flatItems = menuResult[0].items || [];
            setMenuItems(flatItems);
            setMenuTree(buildMenuTree(flatItems));
        }
        setHeaderAds(adsData);
        if (configData.length > 0) {
            setSiteConfig(configData[0]);
        } else {
            // Set a fallback config if none is in the DB
            setSiteConfig({ 
              font_family: 'Assistant', 
              primary_color: '#2563eb', 
              accent_color: '#dc2626',
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

  // Redirect new users to onboarding page, but NOT admins
  useEffect(() => {
    // Add a check to ensure the user is not an admin
    if (user && user.role !== 'admin' && !user.requested_app_role && user.status !== 'approved' && user.status !== 'rejected') {
        const allowedPaths = ['/onboarding', '/logout'];
        // The path in location.pathname is just the path, e.g. /onboarding, not the full URL.
        const currentPath = location.pathname.toLowerCase();
        
        // createPageUrl returns a relative path like /onboarding
        if (!allowedPaths.some(path => currentPath === createPageUrl(path.substring(1)))) { // Use createPageUrl for comparison
             navigate(createPageUrl('Onboarding'));
        }
    }
  }, [user, location, navigate]);


  // navigationItems for desktop will be based on the menuTree
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
      setMobileMenuOpen(false); // Close mobile menu on search
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
      // Add safety checks for styles object
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
      // Add safety checks for font object
      if (!font || !font.familyName || !font.files || !Array.isArray(font.files)) return '';
      
      const fontSources = font.files
        .filter(file => file && file.url && file.format) // Filter out invalid files
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
      .replace(/[^\w\u0590-\u05FF-]/g, '') // Keep Hebrew characters
      .replace(/--+/g, '-')
      .replace(/-+$/, '');
  };

  // Determine if admin toolbar should show padding
  const showAdminToolbarPadding = user?.role === 'admin' && 
                                !location.pathname.includes('Admin') && 
                                !location.pathname.includes('Editor') && 
                                !location.pathname.includes('SpeakerDashboard');

  return (
    <div dir="rtl" style={{ 
        fontFamily: `'${siteConfig?.font_family || 'Assistant'}', sans-serif`,
        '--primary-color': siteConfig?.primary_color || '#2563eb',
        '--accent-color': siteConfig?.accent_color || '#dc2626',
        '--background-color': siteConfig?.background_color || '#f9fafb',
        '--text-primary': siteConfig?.text_color_primary || '#111827',
        '--text-secondary': siteConfig?.text_color_secondary || '#6b7281',
      }}
      className="min-h-screen bg-[var(--background-color)]"
    >
      {/* Admin Toolbar - only for admins */}
      <AdminToolbar user={user} />
      
      {/* Add top padding when admin toolbar is present */}
      <style>{`
        /* Admin toolbar styles */
        .admin-toolbar-active {
          padding-top: 60px;
        }
        
        @media (max-width: 768px) {
          .admin-toolbar-active {
            padding-top: 70px;
          }
        }
        
        /* Preload critical fonts */
        .preload-font {
          font-display: swap;
        }

        /* Load additional fonts only if needed */
        ${(() => {
          const uniqueFonts = new Set();
          // Add siteConfig font if it's not Assistant and fontLinks exists for it
          if (siteConfig?.font_family && fontLinks[siteConfig.font_family] && siteConfig.font_family !== 'Assistant') {
            uniqueFonts.add(siteConfig.font_family);
          }
          // Add typography fonts if they exist and are not Assistant
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
          --primary-color: ${siteConfig?.primary_color || '#2563eb'};
          --accent-color: ${siteConfig?.accent_color || '#dc2626'};
          --background-color: ${siteConfig?.background_color || '#f9fafb'};
          --text-primary: ${siteConfig?.text_color_primary || '#111827'};
          --text-secondary: ${siteConfig?.text_color_secondary || '#6b7281'};
        }

        /* Remove any eval-based code and unsafe practices */
        body {
          background-color: var(--background-color);
          color: var(--text-primary);
          font-family: '${siteConfig?.font_family || 'Assistant'}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow-wrap: break-word; /* Prevent long words from breaking layout */
          font-display: swap; /* Optimize font rendering */
          overflow-x: hidden; /* Global container constraints to prevent overflow */
        }

        /* Rest of existing CSS without any eval or unsafe patterns */
        /* Custom fonts */
        ${generateCustomFontCSS()}

        /* Typography styles */
        ${generateTypographyCSS()}

        /* Main container fixes */
        .max-w-\\[1440px\\] {
          width: 100%;
          max-width: min(1440px, 100vw);
          margin: 0 auto;
        }

        /* Grid container fixes */
        .grid {
          overflow: hidden;
        }
        
        .grid > * {
          min-width: 0;
        }

        /* Utility to hide scrollbars */
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
        }

        .text-lg {
            line-height: 1.25rem !important;
        }

        /* Fix for overflowing embedded content */
        .article-content iframe,
        .article-content video,
        .article-content embed {
            max-width: 100%;
            aspect-ratio: 16 / 9;
            height: auto;
            border-radius: 8px; /* Optional: adds a nice touch */
            margin: 1rem 0;
        }

        /* Performance optimizations */
        .main-header {
          z-index: 50;
          will-change: transform; /* Hint to the browser for better performance on scroll */
          border-bottom: 3px solid var(--primary-color); /* Added blue bar */
        }

        /* Optimized animations */
        .hero-card {
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease; /* Shorter transition for snappier feel */
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          will-change: transform; /* Hint to the browser */
        }

        .hero-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); /* Improved shadow on hover */
        }

        /* Reduce paint operations */
        .text-shadow {
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }

        .text-shadow-lg {
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        }

        .section-title {
          font-size: 1.75rem; /* Larger font for main title */
          font-weight: 800; /* Extra bold */
          color: #333; /* Default dark gray for text */
          margin-bottom: 0.75rem; /* Space below title */
          display: block; /* Make it a block element to take full width */
          text-align: start; /* Align to start (right in RTL) */
          padding-top: 0.5rem; /* Some top padding for overall section if desired */
          contain: layout style; /* Optimize rendering */
        }
        
        /* Update title text color based on class */
        .section-title.green { color: #16a344; }
        .section-title.purple { color: #9333ea; }
        .section-title.blue { color: #2563eb; }
        .section-title.red { color: #dc2626; }

        .section-divider {
          border: none;
          height: 4px; /* Thicker line */
          background-color: var(--primary-color); /* Default to primary color */
          margin: 0 0 1.5rem 0; /* Margin below the divider */
          border-radius: 2px; /* Slightly rounded ends */
          width: 100%; /* Ensure it spans full width */
          contain: layout style; /* Optimize rendering */
        }

        /* Apply colors to the divider */
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
          contain: layout style; /* Optimize rendering */
        }

        .sidebar-news-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-top: none;
          contain: layout style; /* Optimize rendering */
        }

        .sidebar-news-list li {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .sidebar-news-list li:last-child {
          border-bottom: none;
        }

        /* Optimized breaking news animation */
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
          contain: layout style paint; /* Contain layout, style, and paint operations */
        }

        /* Image optimization */
        img {
          content-visibility: auto; /* Defer rendering of off-screen images */
        }

        /* Mobile specific styles */
        @media (max-width: 768px) {
          .section-title {
            font-size: 1.25rem; /* Smaller font on mobile */
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
          
          /* Mobile optimizations */
          .hero-card {
            transition: none; /* Disable transitions on mobile for snappier feel */
          }
          
          .breaking-news-scroll {
            animation-duration: 20s; /* Faster animation on mobile */
          }
        }

        /* Prevent horizontal overflow on all screen sizes */
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

        /* Preload critical elements */
        @media (prefers-reduced-motion: no-preference) {
          .hero-card {
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
      `}</style>

      {/* Main content wrapper for boxed layout with admin toolbar spacing */}
      <div 
        className={`max-w-[1440px] mx-auto bg-white shadow-md ${showAdminToolbarPadding ? 'admin-toolbar-active' : ''}`}
      >
        <header className="main-header px-4">
          {/* Top Header - DESKTOP */}
          <div className="hidden md:flex items-center justify-between py-4">
            {/* Left: AdSense Space */}
            <div className="w-[300px] flex items-center">
              <SmartAdBanner ads={headerAds} position="header" size="header" />
            </div>

            {/* Center: Logo and Slogan */}
            <div className="flex flex-col items-center">
              <Link to={createPageUrl("Home")} className="flex-shrink-0">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dad5fecc4_.png"
                  alt="כאן ישראל"
                  className="w-auto"
                  style={{ height: `${siteConfig?.logo_height || 64}px` }}
                />
              </Link>
              {siteConfig?.site_description && (
                  <p className="hidden md:block text-sm md:text-base text-gray-600 mt-1 font-medium">{siteConfig.site_description}</p>
              )}
            </div>

            {/* Right: Search and User Menu */}
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
          <div className="md:hidden flex items-center justify-between py-3"> {/* Removed border-b */}
              {/* Right Group (in RTL) - Menu Icon */}
              <div className="flex-shrink-0">
                  <button
                      className="p-2 -mr-2"
                      onClick={() => setMobileMenuOpen(true)}
                  >
                      <Menu className="w-6 h-6 text-gray-600" />
                  </button>
              </div>

              {/* Center Logo - takes remaining space */}
              <div className="flex-grow text-center px-2">
                  <Link to={createPageUrl("Home")} className="inline-block">
                      <img
                          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dad5fecc4_.png"
                          alt="כאן ישראל"
                          className="w-auto h-12 max-w-full"
                      />
                  </Link>
              </div>

              {/* Left Group (in RTL) - User Menu */}
              <div className="flex-shrink-0">
                  <UserMenu />
              </div>
          </div>


          {/* Navigation Menu (Desktop) */}
          <nav className="hidden md:flex items-center justify-center py-3">
            <div className="flex items-center space-x-8 space-x-reverse">
              {desktopNavigationItems.map((item) => (
                <NavMenuItem key={item.id} item={item} />
              ))}
              {/* "Advertisers" is a static link, not part of the dynamic menu */}
              <Link to={createPageUrl("Advertisers")} className="text-lg font-semibold transition-colors hover:text-[var(--primary-color)] text-gray-700">פרסם אצלנו</Link>
            </div>
          </nav>
        </header>

        <main className="px-4 py-4 md:py-8">
          {children}
        </main>
      </div> {/* End of content-wrapper bg-white shadow-md */}

      {/* Mobile Menu (remains outside the boxed content wrapper to allow full overlay) */}
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
          {/* Mobile menu: list all top-level items from menu */}
          {menuItems
            .filter(item => !item.parentId)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((item) => {
              // Get link for mobile menu
              const link = item.type === 'category' 
                ? createPageUrl(`Category?slug=${item.slug || generateSlugForMobileMenu(item.label)}`) 
                : (item.type === 'custom' ? item.url : null); // Handle custom type explicitly, null for parent
              
              if (item.type === 'parent') { // Render parent type as non-clickable
                return (
                  <div
                    key={item.id}
                    className="block py-3 px-2 text-lg font-semibold text-gray-700 border-b border-gray-100 cursor-default"
                  >
                    {item.label}
                  </div>
                );
              }

              if (link) { // Render Link if there is a valid link
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
              // Fallback for items without a link but not explicitly 'parent' type
              return (
                <div
                  key={item.id}
                  className="block py-3 px-2 text-lg font-semibold text-gray-700 border-b border-gray-100 cursor-default"
                >
                  {item.label}
                </div>
              );
            })}
          {/* Add "Advertisers" link for mobile */}
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
        <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-10"> {/* Footer content is boxed for alignment */}
          <div className="text-center">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/dad5fecc4_.png"
              alt="כאן ישראל"
              className="h-8 md:h-10 w-auto mb-4 filter brightness-0 invert mx-auto"
            />
            <p className="text-gray-400 text-sm mb-6">
              {siteConfig?.site_description || 'אתר החדשות המוביל בישראל.'}
            </p>
            {/* The SmartAdBanner in the footer needs to use the headerAds state variable as it's the only one populated for ads. 
                If there were specific footer ads, a new state for them would be needed.*/}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
              <a href="#" className="text-gray-400 hover:text-white text-sm">אודות</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">צור קשר</a>
              <Link to={createPageUrl("Advertisers")} className="text-gray-400 hover:text-white text-sm">פרסם אצלנו</Link>
              <Link to={createPageUrl("Privacy")} className="text-gray-400 hover:text-white text-sm">מדיניות פרטיות</Link>
              <Link to={createPageUrl("Terms")} className="text-gray-400 hover:text-white text-sm">תקנון</Link>
            </div>
          </div>
          
          {/* Advertisement Section */}
          <div className="my-8">
            <div className="max-w-[728px] h-24 mx-auto">
              <SmartAdBanner ads={headerAds} position="footer" size="banner" />
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 md:mt-8 pt-6 md:pt-8 text-center text-gray-400">
             <div className="max-w-3xl mx-auto text-xs">
                <h4 className="font-bold text-gray-200 mb-2">סעיף 27א – “יצירות שבעל הזכות בהן אינו ידוע או לא אותר”</h4>
                <p>
                    מערכת בלוג | אתר “כאן ישראל ” פועלת בכל השקידה הסבירה לגילוי או איתור בעל הזכות של יצירה, תמונה או מאמר. השימוש ביצירה בבלוג זה, נעשה לפי סעיף זה 27א’ לחוק זכויות יוצרים. בכל מקרה, בעל הזכות מתבקש לפנות למייל; kanisraelnews@gmail.com ולהודיענו על כך. אנו נפעל להסרה תוך 30 יום מקבלת התלונה למייל זה.
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
