import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from "@/utils";
import { Article } from "@/entities/Article";
import { Category } from "@/entities/Category";
import { Advertisement } from "@/entities/Advertisement";
import { HotArticle } from "@/entities/HotArticle";
import { HomeConfig } from "@/entities/HomeConfig";
import { defaultHomeConfig } from "../components/admin/HomePageEditor";

// Import Home Page Components (Lazy Loaded for performance)
const HeroGrid = lazy(() => import("../components/home/HeroGrid"));
const HeroCards = lazy(() => import("../components/home/HeroCards"));
const HeroKanNaimOriginal = lazy(() => import("../components/home/HeroKanNaimOriginal"));
const BreakingNews = lazy(() => import("../components/home/BreakingNews"));
const CategorySection = lazy(() => import("../components/home/CategorySection"));
const Sidebar = lazy(() => import("../components/home/Sidebar"));
const SmartAdBanner = lazy(() => import("../components/ads/SmartAdBanner"));
const DualAdBanner = lazy(() => import("../components/ads/DualAdBanner"));
const SpecialAlert = lazy(() => import("../components/home/SpecialAlert"));
const VideoSection = lazy(() => import("../components/home/VideoSection"));
import ArticleSlider from "../components/home/ArticleSlider";

const LoadingPlaceholder = () => (
  <div className="flex justify-center items-center min-h-[60vh]">
    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [sidebarArticles, setSidebarArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [homeConfig, setHomeConfig] = useState(null);
  const [specialAlertArticles, setSpecialAlertArticles] = useState({});
  const [sectionsData, setSectionsData] = useState({});
  const [allAds, setAllAds] = useState([]);
  const [videoArticles, setVideoArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [
          heroArticlesData,
          mostViewedForSidebar,
          categoriesData,
          homeConfigData,
          adsData,
          videoArticlesData,
        ] = await Promise.all([
          Article.filter({ published: true }, '-created_date', 20),
          Article.filter({ published: true }, '-views', 10), 
          Category.list(),
          HomeConfig.filter({ config_key: 'homePage' }),
          Advertisement.filter({ active: true }),
          Article.filter({ 
            published: true, 
            media_type: 'video'
          }, '-created_date', 20),
        ]);

        setArticles(heroArticlesData);
        setSidebarArticles(mostViewedForSidebar);
        setCategories(categoriesData);
        
        // Create a map of categories by slug for easy lookup
        const catMap = {};
        categoriesData.forEach(cat => {
          catMap[cat.slug] = cat;
        });
        setCategoriesMap(catMap);

        let loadedConfig;
        if (homeConfigData.length > 0) {
          loadedConfig = homeConfigData[0].config_data;
        } else {
          loadedConfig = defaultHomeConfig;
        }
        
        loadedConfig = {
          ...defaultHomeConfig,
          ...loadedConfig,
          hero: {
            ...defaultHomeConfig.hero,
            ...(loadedConfig.hero || {})
          },
          sections: loadedConfig.sections || defaultHomeConfig.sections,
        };

        setHomeConfig(loadedConfig);
        setAllAds(adsData);
        setVideoArticles(videoArticlesData);
        
        // Fetch articles for special alert sections
        const specialAlertSections = loadedConfig.sections?.filter(s => s.type === 'special_alert' && s.enabled && s.article_id) || [];
        if (specialAlertSections.length > 0) {
            try {
                const specialAlertArticleIds = [...new Set(specialAlertSections.map(s => s.article_id))];
                const fetchedAlertArticles = await Article.filter({ 
                  id: { $in: specialAlertArticleIds }, 
                  published: true 
                });
                const articlesMap = Object.fromEntries(fetchedAlertArticles.map(a => [a.id, a]));
                setSpecialAlertArticles(articlesMap);
            } catch (error) {
                console.warn('Could not load special alert articles:', error);
                setSpecialAlertArticles({});
            }
        }

        // Fetch articles for all other dynamic sections
        try {
            const sectionPromises = loadedConfig.sections
                .filter(section => (section.type === 'articles' || section.type === 'slider') && section.enabled)
                .map(section => 
                    Article.filter({ 
                      category: section.category, 
                      published: true 
                    }, '-created_date', section.articleCount)
                    .then(articles => ({ id: section.id, articles }))
                );

            const results = await Promise.all(sectionPromises);
            
            const sectionsWithData = results.reduce((acc, result) => {
              acc[result.id] = result.articles;
              return acc;
            }, {});
            
            setSectionsData(sectionsWithData);
        } catch (error) {
            console.warn('Could not load section articles:', error);
            setSectionsData({});
        }

      } catch (error) {
        console.warn("Error loading home page data:", error);
        setHomeConfig(defaultHomeConfig);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const heroArticles = useMemo(() => {
    if (!articles || articles.length === 0 || !homeConfig) {
      return [];
    }
    
    if (!homeConfig.hero || homeConfig.hero.enabled === false) {
      return [];
    }
    
    let selectedArticles = [];
    
    const featuredArticles = articles.filter(a => a.is_featured);
    if (featuredArticles.length > 0) {
      selectedArticles = featuredArticles.slice(0, homeConfig.hero.articleCount || 5);
    } else {
      selectedArticles = articles.slice(0, homeConfig.hero.articleCount || 5);
    }
    
    return selectedArticles;
  }, [articles, homeConfig]);

  const hotArticles = useMemo(() => {
    if (!articles || articles.length === 0 || !heroArticles || heroArticles.length === 0) {
        return [];
    }
    const heroArticleIds = new Set(heroArticles.map(a => a.id));
    return articles
      .filter(article => !heroArticleIds.has(article.id))
      .slice(0, 6);
  }, [articles, heroArticles]);

  const renderHero = () => {
    if (!homeConfig?.hero?.enabled || !heroArticles || heroArticles.length === 0) {
      return null;
    }
    
    const layout = homeConfig.hero.grid_style || 'hierarchical-1';
    const redMailLink = homeConfig.hero.redMailLink || 'mailto:kanisraelnews@gmail.com';

    return (
      <Suspense fallback={<LoadingPlaceholder />}>
        {layout === 'cards' ? (
          <HeroCards articles={heroArticles} />
        ) : layout === 'kan-naim-original' ? (
          <HeroKanNaimOriginal 
            articles={heroArticles} 
            breakingNews={hotArticles.slice(0, 6)} 
            redMailLink={redMailLink}
          />
        ) : (
          <HeroGrid articles={heroArticles} layout={layout} />
        )}
      </Suspense>
    );
  };

  const renderDynamicSections = () => {
    if (!homeConfig || !homeConfig.sections) {
      return <LoadingPlaceholder />;
    }
    
    const enabledSections = homeConfig.sections.filter(s => s.enabled);

    return enabledSections.map((section, index) => {
      switch (section.type) {
        case 'articles':
          const articlesForSection = sectionsData[section.id] || [];
          if (articlesForSection.length === 0) {
            return null;
          }
          const categoryForSection = categoriesMap[section.category];
          return (
            <Suspense key={section.id || index} fallback={<LoadingPlaceholder />}>
              <CategorySection
                title={section.title}
                categorySlug={section.category}
                articles={articlesForSection}
                headerStyle={categoryForSection?.header_style}
                displaySettings={section.display || {} }
              />
            </Suspense>
          );

        case 'slider':
          const sliderArticles = sectionsData[section.id] || [];
          if (sliderArticles.length === 0) {
            return null;
          }
          const categoryForSlider = categoriesMap[section.category];
          return (
            <Suspense key={section.id || index} fallback={<LoadingPlaceholder />}>
              <ArticleSlider
                title={section.title}
                categorySlug={section.category}
                articles={sliderArticles}
                headerStyle={categoryForSlider?.header_style}
                displaySettings={section.display || {}}
              />
            </Suspense>
          );

        case 'ad':
          return (
            <div key={section.id || index} className="my-8">
              <SmartAdBanner ads={allAds} size="banner" position={section.position} />
            </div>
          );

        case 'adsense':
          return (
            <div key={section.id || index} className="my-8">
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <p className="text-gray-500">AdSense - {section.position}</p>
              </div>
            </div>
          );

        case 'special_alert': {
            if (!section.article_id || !specialAlertArticles[section.article_id]) {
              return null;
            }
            const articleForAlert = specialAlertArticles[section.article_id];
            return (
              <Suspense key={section.id || index} fallback={<LoadingPlaceholder />}>
                <SpecialAlert article={articleForAlert} />
              </Suspense>
            );
          }

        case 'hot_articles':
          if (hotArticles.length === 0) {
            return null;
          }
          return (
            <Suspense key={section.id || index} fallback={<LoadingPlaceholder />}>
              <div className="mb-12">
                <div className="herald-mod-wrap mb-6">
                  <div className="herald-mod-head relative">
                    <div className="flex justify-between items-end">
                      <div className="flex z-10">
                        <div className="w-2" style={{ backgroundColor: '#091d4f' }}></div>
                        <h2 
                          className="text-white font-bold text-lg px-5 py-2 rounded-tl-lg m-0"
                          style={{
                            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/a2b1f4156_5.png)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          🔥 מאמרים חמים
                        </h2>
                      </div>
                    </div>
                    <div className="flex h-1 mt-[-1px]">
                      <div className="w-2" style={{ backgroundColor: '#091d4f' }}></div>
                      <div 
                        className="flex-1"
                        style={{
                          backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/a2b1f4156_5.png)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotArticles.map((article) => {
                    const displayDate = article.original_publication_date || article.created_date;
                    const isValidDate = displayDate && !isNaN(new Date(displayDate));
                    
                    return (
                      <article key={article.id} className="group">
                        <Link to={createPageUrl(`Article?id=${article.id}`)} className="block">
                          <div className="relative overflow-hidden mb-4">
                            <img
                              src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/250`}
                              className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
                              alt={article.title}
                              loading="lazy"
                            />
                            <div className="absolute top-3 right-3">
                              <span className="bg-red-600 text-white text-xs px-2 py-1 font-bold">
                                🔥 חם
                              </span>
                            </div>
                          </div>
                          <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                            {article.title}
                          </h3>
                          <div className="text-xs text-gray-500">
                            {article.author && <span>{article.author} • </span>}
                            {isValidDate && <span>{format(new Date(displayDate), 'dd/MM/yyyy', { locale: he })}</span>}
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            </Suspense>
          );

        default:
          console.log("Unknown section type:", section.type);
          return null;
      }
    });
  };

  if (loading) {
    return <LoadingPlaceholder />;
  }

  return (
    <div className="w-full space-y-8">
      {homeConfig?.hero?.enabled && homeConfig.hero.showBreakingNews && (
        <Suspense fallback={<LoadingPlaceholder />}>
          <BreakingNews />
        </Suspense>
      )}

      {renderHero()}

      {/* Primary Ad after Hero (full width before sections) */}
      {homeConfig?.hero?.showPrimaryAd !== false && (
        <div className="w-full my-6">
          <Suspense fallback={<LoadingPlaceholder />}>
            <DualAdBanner ads={allAds} />
          </Suspense>
        </div>
      )}

      {/* Primary Video Section (full width before sidebar) */}
      {homeConfig?.primaryVideo?.enabled && (
        <div className="w-full mb-8">
          <Suspense fallback={<LoadingPlaceholder />}>
            <VideoSection 
              articles={videoArticles} 
              title={homeConfig.primaryVideo.title || "חדשות"}
            />
          </Suspense>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <main className="lg:col-span-2 space-y-12 order-1 lg:order-2 min-w-0">
          {renderDynamicSections()}
        </main>
        
        <aside className="lg:col-span-1 order-2 lg:order-1">
          <Suspense fallback={<LoadingPlaceholder />}>
            <Sidebar articles={sidebarArticles} categories={categories} />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}