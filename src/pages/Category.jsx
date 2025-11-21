import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Category as CategoryEntity } from "@/entities/Category"; // Renamed to avoid conflict with component name
import { Article } from "@/entities/Article";
import { Advertisement } from "@/entities/Advertisement";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import SmartAdBanner from '../components/ads/SmartAdBanner';
import HeroGrid from '../components/home/HeroGrid'; // New import

// Helper function to generate slug from name - moved outside component for clean dependency management
const generateSlug = (name) => {
  if (!name) return '';
  // Normalize string, remove special characters, replace spaces with hyphens, handle Hebrew
  return name.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\u0590-\u05FF-]/g, '') // Remove all non-word chars except Hebrew
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

// Updated helper function to get YouTube embed URL with autoplay parameters
const getYouTubeEmbedUrl = (url) => {
  if (!url) return '';
  let videoId = '';
  // Regular watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  }
  // Shortened youtu.be URL: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  else if (url.includes('/embed/')) {
    videoId = url.split('/embed/')[1].split('?')[0];
  }

  if (videoId) {
    const params = new URLSearchParams({
      autoplay: 1,
      mute: 1,
      controls: 0,
      showinfo: 0,
      rel: 0,
      loop: 1,
      playsinline: 1,
      playlist: videoId // Required for loop to work
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }
  // Return original URL if it's not a recognizable YouTube format
  return url;
};

// ArticleCard component
const ArticleCard = ({ article, className = "" }) => {
  const displayDate = article.original_publication_date || article.created_date;

  return (
    <Link
      to={createPageUrl(`Article?id=${article.id}`)}
      className={`hero-card group block bg-white shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden ${className}`}
    >
      <div className="flex gap-4 p-4">
        <img
          src={article.featured_image || `https://picsum.photos/seed/${article.id}/300/200`}
          alt={article.title}
          className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">{article.excerpt}</p>
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={12} className="ml-1" />
            <span>{format(new Date(displayDate), 'd MMMM yyyy', { locale: he })}</span>
            {article.author && <span className="mr-2"> &middot; {article.author}</span>}
            {article.views > 0 && (
              <>
                <Eye size={12} className="ml-1 mr-1" />
                <span>{article.views.toLocaleString()} צפיות</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// SectionHeader component
const SectionHeader = ({ title, colorClass }) => {
  const colorStyles = {
    red: { bg: 'bg-red-600', accent: 'border-blue-800' },
    green: { bg: 'bg-green-600', accent: 'border-blue-800' },
    purple: { bg: 'bg-purple-600', accent: 'border-blue-800' },
    blue: { bg: 'bg-blue-600', accent: 'border-red-600' },
    default: { bg: 'bg-gray-800', accent: 'border-blue-600' },
  };
  const styles = colorStyles[colorClass] || colorStyles.default;

  return (
    <div className="relative mb-8">
      <div className={`w-full h-1 ${styles.bg} mt-8`}></div>
      <div className={`absolute top-0 right-0 text-white font-bold py-2 px-6 rounded-tr-lg ${styles.bg} border-l-8 ${styles.accent}`}>
        <h2 className="text-xl">{title}</h2>
      </div>
    </div>
  );
};

// New: FeaturedArticles Component (kept as it might be used elsewhere, but not for hero anymore)
const FeaturedArticles = ({ articles, layoutStyle }) => {
  if (!articles || articles.length === 0) return null;

  // This layout is a simplified representation of a featured grid.
  // It takes the first few articles and displays them.
  const featuredCount = Math.min(6, articles.length); // Display up to 6 featured articles

  return (
    <div className={`grid gap-6 ${layoutStyle === 'modern' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      {articles.slice(0, featuredCount).map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

// Updated: CategorySection Component
const CategorySection = ({ title, articles, categorySlug, colorClass, showMore, displaySettings = {} }) => {
  if (!articles || articles.length === 0) return null;

  const columns = displaySettings.columns || 3;
  const gridClass = `grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`;

  return (
    <div className="mb-12">
      <SectionHeader title={title} colorClass={colorClass} />
      <div className={`grid ${gridClass} gap-6`}>
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
      {showMore && (
        <div className="text-center mt-8">
          <Link
            to={createPageUrl(`Category?slug=${categorySlug}`)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            צפה בכל הכתבות בקטגוריה זו
            <svg className="w-5 h-5 mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </Link>
        </div>
      )}
    </div>
  );
};

// New: ArticleSidebar Component
const ArticleSidebar = ({ categorySlug, relatedCategories, ads }) => {
  return (
    <div className="space-y-8">
      {relatedCategories && relatedCategories.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">קטגוריות קשורות</h3>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map(cat => (
              <Link
                key={cat.id || cat.slug}
                to={createPageUrl(`Category?slug=${cat.slug || cat}`)}
                className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm"
              >
                {cat.name || cat}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ad Banner */}
      <SmartAdBanner ads={ads} section="category_sidebar" />

      {/* Placeholder for popular articles - in a real app, this would fetch data */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">הכתבות הנצפות ביותר בקטגוריה</h3>
        <ul className="space-y-4">
          <li className="text-gray-600 text-sm">כתבה לדוגמה 1</li>
          <li className="text-gray-600 text-sm">כתבה לדוגמה 2</li>
          <li className="text-gray-600 text-sm">כתבה לדוגמה 3</li>
        </ul>
      </div>
    </div>
  );
};

// Minimal LoadingPlaceholder component
const LoadingPlaceholder = () => (
  <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="ml-3 text-gray-600">טוען...</span>
  </div>
);

// Minimal ArticleSlider component
const ArticleSlider = ({ title, categorySlug, articles, displaySettings }) => {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="mb-12">
      <SectionHeader title={title} colorClass={displaySettings.colorClass || "blue"} />
      <div className="overflow-x-auto whitespace-nowrap py-4 scrollbar-hide">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} className="inline-block w-80 mr-4 flex-shrink-0" />
        ))}
      </div>
      {displaySettings.showMore && categorySlug && (
        <div className="text-center mt-8">
          <Link
            to={createPageUrl(`Category?slug=${categorySlug}`)}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          >
            צפה בכל הכתבות בקטגוריה זו
            <svg className="w-5 h-5 mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </Link>
        </div>
      )}
    </div>
  );
};


export default function CategoryPage() {
  const location = useLocation();
  const [articles, setArticles] = useState([]); // Main articles for the category
  const [category, setCategory] = useState(null);
  const [allAds, setAllAds] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Replaced subcategoryArticles with sectionsData for dynamic rendering
  const [sectionsData, setSectionsData] = useState({});
  const [hotArticles, setHotArticles] = useState([]);

  // Memoize URL search params to avoid re-computations
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialSlug = urlParams.get("slug");
  const initialName = urlParams.get("name");

  // Derive heroArticles from the main articles state.
  // Assuming HeroGrid typically uses the first few articles (e.g., up to 5 for various layouts).
  const heroArticles = useMemo(() => articles.slice(0, 5), [articles]);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);

      let slug = initialSlug;
      const name = initialName;

      // If no slug but we have a name, generate slug from name
      if (!slug && name) {
        slug = generateSlug(decodeURIComponent(name));
      }

      if (!slug) {
        setLoading(false);
        setError('No category slug or name provided');
        return;
      }

      try {
        // Load category and articles without authentication - these entities are designed for public access
        const [allCategoriesData, allAdsData] = await Promise.all([
          CategoryEntity.list(),
          Advertisement.filter({ active: true })
        ]);

        setAllCategories(allCategoriesData);
        setAllAds(allAdsData);

        let currentCategory = allCategoriesData.find(c => c.slug === slug);

        // If not found by slug, try to find by name and generate the missing slug
        if (!currentCategory && name) {
          const decodedName = decodeURIComponent(name);
          currentCategory = allCategoriesData.find(c => c.name === decodedName);

          // If found by name but missing slug, update the category with the generated slug
          // This ensures canonical URLs for categories found by name
          if (currentCategory && !currentCategory.slug) {
            if (currentCategory.id) {
              await CategoryEntity.update(currentCategory.id, { slug: slug });
              currentCategory.slug = slug; // Update local copy
              // Optionally, update the allCategoriesData in state to reflect the change
              setAllCategories(prev => prev.map(cat =>
                cat.id === currentCategory.id ? { ...cat, slug: slug } : cat
              ));
            } else {
              console.warn("Category found by name has no ID, cannot update slug.");
            }
          }
        }

        if (!currentCategory) {
          setCategory(null);
          setArticles([]);
          setSectionsData({}); // Clear if no category
          setHotArticles([]); // Clear if no category
          setError('קטגוריה לא נמצאה');
          return;
        }

        setCategory(currentCategory);

        // --- Dynamic Section and Hot Articles Fetching ---
        const pageConfig = currentCategory.page_config;
        const sectionsToFetch = [];
        const articlesPromises = [];
        const currentSectionsData = {};

        if (pageConfig && pageConfig.sections) {
          for (const section of pageConfig.sections) {
            if (section.enabled && (section.type === 'articles' || section.type === 'slider')) {
              sectionsToFetch.push(section);
              articlesPromises.push(
                // All article fetches are for published content, ensuring public visibility
                Article.filter(
                  {
                    published: true, // Ensuring only published articles are fetched
                    'categories.primary': section.category // Assuming section.category is a slug
                  },
                  '-created_date', // Sort by newest first
                  section.article_count || section.display?.limit || 6 // Default to 6 if not specified
                )
              );
            }
          }
        }

        // Fetch hot articles if needed for a 'hot_articles' section
        const hotArticlesSectionExists = pageConfig?.sections?.some(s => s.enabled && s.type === 'hot_articles');
        if (hotArticlesSectionExists) {
          articlesPromises.push(
            Article.filter(
              { published: true, is_hot: true }, // Ensuring only published and hot articles are fetched
              '-created_date', // Sort by newest first (changed from '-views')
              6 // Limit hot articles
            )
          );
        }

        // Execute all article fetches concurrently
        const results = await Promise.all(articlesPromises);

        let resultIndex = 0;
        sectionsToFetch.forEach(section => {
          currentSectionsData[section.id] = results[resultIndex++];
        });

        if (hotArticlesSectionExists) {
          setHotArticles(results[resultIndex++]);
        } else {
          setHotArticles([]);
        }

        setSectionsData(currentSectionsData);
        // The first set of articles from the dynamic sections or a default if applicable
        setArticles(results[0] || []); 

      } catch (err) {
        console.error("Error fetching category content:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [location.search, initialSlug, initialName]); // Re-run effect when URL params change

  const renderHero = useCallback(() => {
    if (!heroArticles || heroArticles.length === 0) return null;

    if (category?.page_config?.hero_type === 'video' && category.page_config.hero_video_url) {
      return (
        <div className="mb-12">
          <div className="max-w-4xl mx-auto">
            <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={getYouTubeEmbedUrl(category.page_config.hero_video_url)}
                className="absolute top-0 left-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={category.page_config.hero_video_title || category.name}
              />
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Title on top */}
              {category.page_config.hero_video_title && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center text-shadow-lg">
                    {category.page_config.hero_video_title}
                  </h2>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default to grid if not video or no video URL
    const layout = category?.page_config?.hero_grid_style || 'hierarchical-1';
    return (
      <div className="mb-12"> {/* Wrap HeroGrid in a div with margin for consistent spacing */}
        <HeroGrid articles={heroArticles} layout={layout} />
      </div>
    );
  }, [category, heroArticles]);

  const renderDynamicSections = () => {
    const pageConfig = category?.page_config;
    if (!pageConfig || !pageConfig.sections) {
      return null;
    }
    
    const enabledSections = pageConfig.sections.filter(s => s.enabled);

    return enabledSections.map((section, index) => {
      switch (section.type) {
        case 'articles':
          const articlesForSection = sectionsData[section.id] || [];
          if (articlesForSection.length === 0) {
            return null;
          }
          return (
            <Suspense key={section.id || index} fallback={<LoadingPlaceholder />}>
              <CategorySection
                title={section.title}
                categorySlug={section.category}
                articles={articlesForSection}
                colorClass={section.colorClass}
                displaySettings={section.display || {}}
                showMore={section.display?.showMore || false}
              />
            </Suspense>
          );

        case 'slider':
          const sliderArticles = sectionsData[section.id] || [];
          if (sliderArticles.length === 0) {
            return null;
          }
          return (
            <Suspense key={section.id || index} fallback={<LoadingPlaceholder />}>
              <ArticleSlider
                title={section.title}
                categorySlug={section.category}
                articles={sliderArticles}
                displaySettings={section.display || {}}
              />
            </Suspense>
          );

        case 'ad':
          return (
            <div key={section.id || index} className="my-8">
              <SmartAdBanner ads={allAds} section={section.position} />
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
                        <div className="bg-red-600 text-white font-bold text-lg px-5 py-2 rounded-tl-lg">
                          🔥 מאמרים חמים
                        </div>
                      </div>
                    </div>
                    <div className="flex h-1 mt-[-1px]">
                      <div className="w-2" style={{ backgroundColor: '#091d4f' }}></div>
                      <div className="flex-1 bg-red-600"></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hotArticles.map((article) => (
                    <article key={article.id} className="group">
                      <Link to={createPageUrl(`Article?id=${article.id}`)} className="block">
                        <div className="relative overflow-hidden rounded-lg mb-4">
                          <img
                            src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/250`}
                            className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                            alt={article.title}
                            loading="lazy"
                          />
                          <div className="absolute top-3 right-3">
                            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                              🔥 חם
                            </span>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                        <div className="text-xs text-gray-500">
                          {article.author && <span>{article.author} • </span>}
                          <span>{format(new Date(article.created_date), 'dd/MM/yyyy', { locale: he })}</span>
                        </div>
                      </Link>
                    </article>
                  ))}
                </div>
              </div>
            </Suspense>
          );

        default:
          return null;
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <div className="text-xl text-red-600">שגיאה בטעינת הנתונים</div>
        <div className="text-gray-600 mt-2">{error}</div>
        <button
          onClick={() => { window.location.reload(); }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  if (!category) {
    return <div className="text-center py-10 text-xl">קטגוריה לא נמצאה.</div>;
  }

  // Use category config for overall page layout style
  const layoutStyle = category.page_config?.layout_style || 'classic'; // Default to 'classic'

  return (
    <div className={`bg-gradient-to-br from-gray-50 to-white min-h-screen ${layoutStyle === 'modern' ? 'font-light' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
        {category && (
          <header className="mb-8 text-center border-b-4 pb-4" style={{ borderColor: category.color_class ? `var(--color-${category.color_class})` : 'var(--primary-color)' }}>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">{category.name}</h1>
            {category.description && <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">{category.description}</p>}
          </header>
        )}
        
        {renderHero()}

        <div className="mt-12">
          {/* Main Content & Sidebar Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <main className="lg:col-span-8 space-y-12">
              {renderDynamicSections()}
            </main>

            <aside className="lg:col-span-4">
              <ArticleSidebar
                categorySlug={category.slug}
                relatedCategories={category.page_config?.related_categories}
                ads={allAds}
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}