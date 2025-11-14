
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Article } from '@/entities/Article';
import { User } from '@/entities/User';
import { SiteConfig } from '@/entities/SiteConfig';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Eye, Tag, MessageSquare } from 'lucide-react';
import ArticleSidebar from '../components/article/ArticleSidebar';
import RelatedArticles from '../components/article/RelatedArticles';
import AuthorProfileCard from '../components/article/AuthorProfileCard';
import { createPageUrl } from '@/utils';
import ContentRenderer from '../components/article/ContentRenderer';
import AdminToolbar from '../components/admin/AdminToolbar';
import { getAuthorPublicProfile } from '@/functions/getAuthorPublicProfile';

export default function ArticlePage() {
  const [article, setArticle] = useState(null);
  const [authorUser, setAuthorUser] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // This holds currentUserData for admin checks
  const [siteConfig, setSiteConfig] = useState(null);
  const [showAdminToolbar, setShowAdminToolbar] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);

      const urlParams = new URLSearchParams(location.search);
      const articleId = urlParams.get('id');
      const isPreviewMode = urlParams.get('preview') === 'true';

      if (!articleId) {
        setError('מזהה מאמר חסר');
        setLoading(false);
        return;
      }

      try {
        // Get current user - still needed for admin checks and toolbar
        const currentUserData = await User.me().catch(() => null);
        setUser(currentUserData);
        setShowAdminToolbar(currentUserData?.role === 'admin');

        const siteConfigData = await SiteConfig.list();
        if (siteConfigData.length > 0) {
          setSiteConfig(siteConfigData[0]);
        }

        // Determine article filter based on user role and preview mode
        let articleFilter = { id: articleId };
        if (!isPreviewMode && currentUserData?.role !== 'admin') {
          // For public users (non-admin, not in preview mode), only fetch published articles
          articleFilter.published = true;
        }

        const articleData = await Article.filter(articleFilter);

        if (articleData && articleData.length > 0) {
          const currentArticle = articleData[0];

          // Secondary check: if for some reason an unpublished article was fetched by a public user,
          // or if the backend filter wasn't strict enough.
          if (!currentArticle.published && !isPreviewMode && currentUserData?.role !== 'admin') {
              setArticle(null);
              setError('המאמר לא נמצא או לא פורסם'); // More specific error message
              setLoading(false);
              return;
          }

          setArticle(currentArticle);

          // Enhanced author data loading: Try public profile first, then fallback to article fields
          let authorData = null;
          if (currentArticle.author_user_id) {
            try {
              const authorProfileResponse = await getAuthorPublicProfile({ userId: currentArticle.author_user_id });
              if (authorProfileResponse?.data?.success) {
                const profile = authorProfileResponse.data.profile;
                authorData = {
                  id: profile.id,
                  display_name: profile.display_name || profile.full_name || currentArticle.author,
                  bio: profile.bio || currentArticle.author_bio,
                  profile_image_url: profile.profile_image_url || currentArticle.author_image,
                  social_links: profile.social_links || currentArticle.author_social_links || {}
                };
              }
            } catch (error) {
              console.warn('Could not fetch author public profile:', error);
            }
          }

          // If no user profile found/fetched (or no author_user_id), fall back to article fields
          if (!authorData && currentArticle.author) {
            authorData = {
              id: currentArticle.author_user_id, // This might be null, but kept for consistency
              display_name: currentArticle.author,
              bio: currentArticle.author_bio,
              profile_image_url: currentArticle.author_image,
              social_links: currentArticle.author_social_links || {}
            };
          }
          setAuthorUser(authorData);

          // Only increment views if not in preview mode and user is not an admin (i.e., a public view)
          if (!isPreviewMode && (!currentUserData || currentUserData.role !== 'admin')) {
            try {
              await Article.update(currentArticle.id, { views: (currentArticle.views || 0) + 1 });
            } catch (error) {
              console.warn('Could not update view count:', error);
            }
          }

          // Load related articles
          if (currentArticle.categories?.primary) {
            try {
              const related = await Article.filter(
                {
                  category: currentArticle.categories.primary,
                  published: true, // Only show published related articles
                  id: { $ne: currentArticle.id } // Exclude the current article
                },
                '-created_date',
                4 // Fetch slightly more to ensure 3 unique ones, if needed
              );
              setRelatedArticles(related.slice(0, 3));
            } catch (error) {
              console.warn('Could not load related articles:', error);
              setRelatedArticles([]);
            }
          }
        } else {
          // If no article found or it's not published for public access
          setError('המאמר לא נמצא או לא פורסם');
        }
      } catch (error) {
        console.error('Error fetching article:', error);
        setError('שגיאה בטעינת המאמר');
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [location.search]); // Depend on location.search to re-fetch when URL parameters change

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">שגיאה</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link to={createPageUrl('Home')} className="text-blue-600 hover:text-blue-800 underline">
          חזור לדף הבית
        </Link>
      </div>
    );
  }

  if (!article) {
    // This case should ideally be caught by `error` state, but as a fallback
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">מאמר לא נמצא</h1>
        <p className="text-gray-600 mb-8">המאמר שחיפשת לא קיים או הוסר.</p>
        <Link to={createPageUrl('Home')} className="text-blue-600 hover:text-blue-800 underline">
          חזור לדף הבית
        </Link>
      </div>
    );
  }

  const authorName = authorUser?.display_name || article.author || 'כתב כאן ישראל';
  const displayDate = article.original_publication_date || article.created_date;
  const isValidDate = displayDate && !isNaN(new Date(displayDate));

  return (
    <>
      {showAdminToolbar && <AdminToolbar articleId={article.id} />}
      <div className="bg-white" style={{ direction: article.text_direction || 'rtl' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* The content grid - fixed RTL order */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* MAIN CONTENT - Right side in RTL (order-1) */}
            <main className="lg:col-span-2 order-1 lg:order-1 min-w-0">
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg">
                <header className="mb-8">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4"
                      style={{ fontFamily: siteConfig?.typography?.h1?.fontFamily || 'inherit' }}>
                    {article.title}
                  </h1>
                  {article.excerpt && (
                    <p className="text-lg sm:text-xl text-gray-600">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="mt-4 flex items-center space-x-4 space-x-reverse text-sm text-gray-500">
                    {authorUser ? (
                      <div className="flex items-center">
                        <img src={authorUser.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`} alt={authorName} className="w-8 h-8 rounded-full ml-2 object-cover" />
                        <span>{authorName}</span>
                      </div>
                    ) : (
                      <span>{authorName}</span>
                    )}
                    {isValidDate && (
                      <>
                        <span>&bull;</span>
                        <span>
                          {format(new Date(displayDate), 'd בMMMM, yyyy', { locale: he })}
                        </span>
                      </>
                    )}
                    {article.reading_time > 0 && (
                      <>
                        <span>&bull;</span>
                        <span>{article.reading_time} דקות קריאה</span>
                      </>
                    )}
                    {typeof article.views !== 'undefined' && (
                      <>
                        <span>&bull;</span>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{article.views} צפיות</span>
                        </div>
                      </>
                    )}
                    {/* Comments Placeholder */}
                    <>
                      <span>&bull;</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>תגובות (0)</span>
                      </div>
                    </>
                  </div>
                </header>

                {/* Conditional rendering of featured image outside of ContentRenderer */}
                {!article.hide_featured_image && article.media_type === "image" && article.featured_image && (
                  <img
                    src={article.featured_image}
                    alt={article.featured_image_alt || article.title}
                    className="w-full h-auto object-cover rounded-xl shadow-lg mb-8"
                  />
                )}

                {/* ContentRenderer now receives article.content directly and articleId */}
                <ContentRenderer content={article.content} articleId={article.id} />

                {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
                  <div className="mt-8 pt-4 border-t">
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag className="w-5 h-5 text-gray-500" />
                      <h3 className="font-semibold">תגיות:</h3>
                      {article.tags.map((tag, index) => (
                        <Link key={index} to={createPageUrl(`Search?q=${encodeURIComponent(tag)}`)} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200">
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author Card - only show if we have meaningful author data */}
                {authorUser && (authorUser.display_name || authorUser.bio) && (
                  <AuthorProfileCard user={authorUser} />
                )}

              </div>

              <RelatedArticles articles={relatedArticles} />

            </main>
            {/* SIDEBAR - Left side in RTL (order-2) */}
            <aside className="lg:col-span-1 order-2 lg:order-2">
              <ArticleSidebar
                currentArticleId={article.id}
                categorySlug={article.categories?.primary || article.category}
              />
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
