import { Clock, ArrowLeft, MessageSquare, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const LargeArticle = ({ article, displaySettings = {} }) => {
  if (!article) return null;
  const displayDate = article.original_publication_date || article.created_date;
  const isValidDate = displayDate && !isNaN(new Date(displayDate));

  return (
    <article className="herald-lay-f group">
      <Link to={createPageUrl(`Article?id=${article.id}`)} className="block">
        <div className="herald-post-thumbnail mb-4 overflow-hidden">
          <img
            width="300"
            height="168"
            src={article.featured_image || `https://picsum.photos/seed/${article.id}/300/168`}
            className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-105"
            alt={article.title}
            loading="lazy"
          />
        </div>
        
        <div className="entry-header">
          <h2 className="entry-title text-lg font-bold leading-tight mb-2 group-hover:text-blue-600 transition-colors duration-200">
            {article.title}
          </h2>
          
          {/* Display excerpt if enabled */}
          {displaySettings.showExcerpt !== false && article.excerpt && (
            <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>
          )}
          
          <div className="entry-meta text-xs text-gray-500 flex items-center gap-3">
            {/* Date */}
            {displaySettings.showDate !== false && isValidDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(displayDate), 'dd/MM/yyyy', { locale: he })}</span>
              </div>
            )}
            
            {/* Author */}
            {displaySettings.showAuthor !== false && article.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{article.author}</span>
              </div>
            )}
            
            {/* Comments */}
            {displaySettings.showComments !== false && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>תגובות (0)</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

const SmallArticle = ({ article, displaySettings = {} }) => {
  if (!article) return null;
  const displayDate = article.original_publication_date || article.created_date;
  const isValidDate = displayDate && !isNaN(new Date(displayDate));

  return (
    <article className="herald-lay-k group">
      <Link to={createPageUrl(`Article?id=${article.id}`)} className="flex space-x-3 space-x-reverse">
        <div className="herald-post-thumbnail flex-shrink-0 overflow-hidden">
          <img
            width="130"
            height="86"
            src={article.featured_image || `https://picsum.photos/seed/${article.id}/130/86`}
            className="w-[130px] aspect-video object-cover transition-opacity duration-300 group-hover:opacity-80"
            alt={article.title}
            loading="lazy"
          />
        </div>
        
        <div className="entry-header flex-1">
          <h2 className="entry-title text-sm font-semibold leading-tight mb-2 group-hover:text-blue-600 transition-colors duration-200 line-clamp-3">
            {article.title}
          </h2>
          
          {/* Display excerpt if enabled */}
          {displaySettings.showExcerpt !== false && article.excerpt && (
            <p className="text-xs text-gray-600 mb-2 leading-relaxed line-clamp-1">
              {article.excerpt}
            </p>
          )}
          
          <div className="entry-meta text-xs text-gray-500 flex items-center gap-2 flex-wrap">
            {/* Date */}
            {displaySettings.showDate !== false && isValidDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{format(new Date(displayDate), 'dd/MM/yyyy', { locale: he })}</span>
              </div>
            )}
            
            {/* Author */}
            {displaySettings.showAuthor !== false && article.author && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{article.author}</span>
              </div>
            )}
            
            {/* Comments */}
            {displaySettings.showComments !== false && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>(0)</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default function CategorySection({ title, categorySlug, articles, headerStyle, displaySettings = {} }) {
  if (!articles || articles.length === 0) {
    return null;
  }
  
  // Default header style if not provided
  const defaultHeaderStyle = {
    type: 'background',
    image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/a2b1f4156_5.png'
  };
  
  const style = headerStyle || defaultHeaderStyle;
  
  // Split articles: first 3 for large display, rest for small
  const largeArticles = articles.slice(0, 3);
  const smallArticles = articles.slice(3);

  return (
    <div className="herald-module mb-12">
      {/* Module Header */}
      <div className="herald-mod-wrap mb-6">
        <div className="herald-mod-head relative">
          <div className="flex justify-between items-end">
            {/* The title itself */}
            <div className="flex z-10">
              <div className="w-2" style={{ backgroundColor: '#091d4f' }}></div>
              <h2 
                className="text-white font-bold text-lg px-5 py-2 rounded-tl-lg m-0"
                style={{
                  backgroundImage: `url(${style.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {title}
              </h2>
            </div>

            {/* "All articles" link */}
            <Link 
              to={createPageUrl(`Category?slug=${categorySlug}`)} 
              className="flex items-center space-x-2 space-x-reverse text-blue-600 hover:text-blue-800 transition-colors text-sm font-semibold pb-1"
            >
              <span>כל הכתבות</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          {/* The underline */}
          {style.type === 'background' ? (
            <div className="flex h-1 mt-[-1px]">
              <div className="w-2" style={{ backgroundColor: '#091d4f' }}></div>
              <div 
                className="flex-1"
                style={{
                  backgroundImage: `url(${style.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              ></div>
            </div>
          ) : (
            <div className="h-1 mt-[-1px]">
              <img 
                src={style.image_url} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="herald-posts">
        {/* Top Row - 3 Large Articles */}
        {largeArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {largeArticles.map((article) => (
              <LargeArticle key={article.id} article={article} displaySettings={displaySettings} />
            ))}
          </div>
        )}

        {/* Bottom Grid - Small Articles */}
        {smallArticles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smallArticles.map((article) => (
              <SmallArticle key={article.id} article={article} displaySettings={displaySettings} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}