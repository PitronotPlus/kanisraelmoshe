
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Eye, Rss, Newspaper, CloudSun, Calendar, DollarSign, Video, ShoppingCart, Archive, Zap } from 'lucide-react';
import YouTubeFacade from '../common/YouTubeFacade';
import { HomeConfig } from '@/entities/HomeConfig'; // Import HomeConfig entity

import SmartAdBanner from '../ads/SmartAdBanner';
import BreakingNewsSidebar from './BreakingNewsSidebar';
import EventsCalendar from './EventsCalendar';
import SportsFlash from './SportsFlash';
import CurrencyExchange from './CurrencyExchange';
import WeatherWidget from './WeatherWidget';
import ArchiveWidget from './ArchiveWidget';
import GoogleNewsFeed from './GoogleNewsFeed';

const VideoWidget = ({ videoUrl, videoTitle }) => {
  const getYouTubeVideoId = (url) => {
    if (!url) return 'dQw4w9WgXcQ';
    
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : 'dQw4w9WgXcQ';
  };

  const videoId = getYouTubeVideoId(videoUrl);
  const title = videoTitle || 'וידאו מומלץ';

  return (
    <div className="mb-8">
      <div className="sidebar-section-title">
        <span>{title}</span>
      </div>
      <div className="bg-white border border-gray-200 border-t-0">
        <YouTubeFacade videoId={videoId} title={title} />
      </div>
    </div>
  );
};

const AliExpressWidget = ({ affiliateId, categories }) => {
  const products = [
    { id: 1, image: "https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=150&h=150&fit=crop" },
    { id: 2, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=150&fit=crop" },
    { id: 3, image: "https://images.unsplash.com/photo-1503602642458-232111445657?w=150&h=150&fit=crop" },
    { id: 4, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop" }
  ];

  return (
    <div className="mb-8">
      <div className="bg-white border border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <div key={product.id} className="relative group cursor-pointer">
              <img 
                src={product.image} 
                alt="מוצר" 
                className="w-full aspect-square object-cover rounded-lg hover:opacity-90 transition-opacity"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CustomAdWidget = ({ widget }) => {
  if (!widget || (widget.adType === 'html' && !widget.htmlCode)) return null;

  return (
    <div className="mb-8">
      <div className="sidebar-section-title">
        <span>{widget.title}</span>
      </div>
      <div className="bg-white border border-gray-200 border-t-0 p-4">
        {widget.adType === 'html' && widget.htmlCode && (
          <div dangerouslySetInnerHTML={{ __html: widget.htmlCode }} />
        )}
        {widget.adType === 'javascript' && widget.jsCode && (
          // Instead of dangerouslySetInnerHTML with script, use a safer approach
          <div className="ad-placeholder bg-gray-100 p-4 text-center text-gray-600">
            JavaScript ads are disabled for security. Please use HTML format instead.
          </div>
        )}
        {widget.adType === 'image' && widget.imageUrl && (
          <a href={widget.linkUrl} target="_blank" rel="noopener noreferrer">
            <img src={widget.imageUrl} alt={widget.title} className="w-full" />
          </a>
        )}
        {widget.adType === 'adsense' && widget.htmlCode && (
          <div dangerouslySetInnerHTML={{ __html: widget.htmlCode }} />
        )}
      </div>
    </div>
  );
};

const MostViewedWidget = ({ articles = [], count = 10 }) => {
  if (!articles || !Array.isArray(articles) || articles.length === 0) {
    return (
      <div className="mb-8">
        <div className="sidebar-section-title">
          <span>הכתבות הנצפות ביותר</span>
          <Eye className="w-5 h-5 text-orange-500" />
        </div>
        <div className="bg-white border border-gray-200 border-t-0 p-4 text-center text-gray-500">
          אין כתבות זמינות כרגע
        </div>
      </div>
    );
  }

  const displayedArticles = articles.slice(0, count);

  return (
    <div className="mb-8">
      <div className="sidebar-section-title">
        <span>הכתבות הנצפות ביותר</span>
        <Eye className="w-5 h-5 text-orange-500" />
      </div>
      <ul className="sidebar-news-list">
        {displayedArticles.map((article) => (
          <li key={article.id}>
            <Link to={createPageUrl(`Article?id=${article.id}`)} className="flex items-start space-x-3 space-x-reverse hover:bg-gray-50 transition-colors p-2 -m-2">
              {article.featured_image && (
                <div className="flex-shrink-0 w-16 h-12 rounded overflow-hidden">
                  <img 
                    src={article.featured_image} 
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold leading-tight text-sm text-gray-800 line-clamp-2">
                  {article.title}
                </p>
                <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                  <span>{article.author || 'כאן ישראל'}</span>
                  <span className="flex items-center space-x-1 space-x-reverse">
                    <Eye className="w-4 h-4" />
                    <span>{article.views || 0}</span>
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Sidebar = ({ articles = [], ads = [] }) => {
  const [sidebarConfig, setSidebarConfig] = useState([]);

  const defaultSidebarConfig = [
    { id: 'breaking_news', title: 'חדשות מתפרצות', enabled: true, icon: Rss, type: 'news_feed', count: 5 },
    { id: 'sports_flash', title: 'מבזקי ספורט', enabled: true, icon: Newspaper, type: 'news_feed', count: 5 },
    { id: 'weather', title: 'מזג אוויר', enabled: true, icon: CloudSun, type: 'weather', location: 'תל אביב' },
    { id: 'events_calendar', title: 'לוח אירועים', enabled: true, icon: Calendar, type: 'events' },
    { id: 'currency_exchange', title: 'שערי חליפין', enabled: true, icon: DollarSign, type: 'currency', currencies: ['USD', 'EUR', 'GBP'] },
    { id: 'most_viewed', title: 'הכתבות הנצפות ביותר', enabled: true, icon: Eye, type: 'popular_articles', count: 5 },
    { id: 'google_news', title: 'מבזקי חדשות (Google)', enabled: true, icon: Rss, type: 'google_news', count: 5, query: 'ישראל חדשות' },
    { id: 'video', title: 'וידאו', enabled: true, icon: Video, type: 'video', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', videoTitle: 'וידאו מומלץ' },
    { id: 'ad_sidebar_top', title: 'פרסומת עליונה', enabled: true, icon: Zap, type: 'advertisement', position: 'sidebar_top', adType: 'html', htmlCode: '', jsCode: '', imageUrl: '', linkUrl: '' },
    { id: 'aliexpress', title: 'AliExpress', enabled: true, icon: ShoppingCart, type: 'aliexpress', affiliateId: '', categories: ['אלקטרוניקה', 'בית וגן', 'אופנה'] },
    { id: 'archive', title: 'ארכיון', enabled: true, icon: Archive, type: 'archive', displayType: 'monthly' },
    { id: 'ad_sidebar_bottom', title: 'פרסומת תחתונה', enabled: true, icon: Zap, type: 'advertisement', position: 'sidebar_bottom', adType: 'html', htmlCode: '', jsCode: '', imageUrl: '', linkUrl: '' },
  ];

  useEffect(() => {
    const loadSidebarConfig = async () => {
      try {
        const configResults = await HomeConfig.filter({ config_key: 'sidebarConfig' });
        
        if (configResults.length > 0) {
          const savedData = configResults[0].config_data; // This might be an object containing 'widgets'
          const savedConfig = savedData ? savedData.widgets : null; // Extract 'widgets' array if savedData is an object
          
          if (savedConfig && Array.isArray(savedConfig)) {
            const savedOrder = savedConfig.map(w => w.id);
            
            const mergedConfig = defaultSidebarConfig
              .map(defaultWidget => {
                  const savedWidget = savedConfig.find(w => w.id === defaultWidget.id);
                  return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
              })
              .sort((a, b) => {
                  const indexA = savedOrder.indexOf(a.id);
                  const indexB = savedOrder.indexOf(b.id);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
              });
            
            setSidebarConfig(mergedConfig);
          } else {
            setSidebarConfig(defaultSidebarConfig);
          }
        } else {
          setSidebarConfig(defaultSidebarConfig);
        }
      } catch (error) {
        console.error("Error loading sidebar config from database:", error);
        setSidebarConfig(defaultSidebarConfig);
      }
    };

    loadSidebarConfig();
  }, []);

  const renderWidget = (widget) => {
    if (!widget.enabled) return null;

    try {
      switch (widget.type) {
        case 'advertisement':
          return <CustomAdWidget key={widget.id} widget={widget} />;
          
        case 'video':
          return (
            <VideoWidget 
              key={widget.id} 
              videoUrl={widget.videoUrl} 
              videoTitle={widget.videoTitle} 
            />
          );
          
        case 'popular_articles':
          return (
            <MostViewedWidget 
              key={widget.id} 
              articles={articles} 
              count={widget.count || 10} 
            />
          );
          
        case 'aliexpress':
          return (
            <AliExpressWidget 
              key={widget.id} 
              affiliateId={widget.affiliateId} 
              categories={widget.categories} 
            />
          );
          
        case 'news_feed':
          if (widget.id === 'breaking_news') {
            return <BreakingNewsSidebar key={widget.id} count={widget.count} />;
          } else if (widget.id === 'sports_flash') {
            return <SportsFlash key={widget.id} count={widget.count} />;
          }
          break;
          
        case 'weather':
          return <WeatherWidget key={widget.id} location={widget.location} />;
          
        case 'events':
          return <EventsCalendar key={widget.id} />;
          
        case 'currency':
          return <CurrencyExchange key={widget.id} currencies={widget.currencies} />;
          
        case 'google_news':
          return (
            <GoogleNewsFeed 
              key={widget.id} 
              query={widget.query} 
              count={widget.count} 
            />
          );
          
        case 'archive':
          return <ArchiveWidget key={widget.id} displayType={widget.displayType} />;
          
        default:
          if (widget.id.startsWith('ad_')) {
            return (
              <SmartAdBanner 
                key={widget.id} 
                ads={ads} 
                position={widget.position} 
                size="square" 
              />
            );
          }
          return null;
      }
    } catch (error) {
      console.error(`Error rendering widget ${widget.id}:`, error);
      return null;
    }
    
    return null;
  };

  return (
    <aside className="space-y-8 sticky top-24">
      {sidebarConfig.map(renderWidget)}
    </aside>
  );
};

export default Sidebar;
