import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Clock, User, MessageSquare, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

const ArticleCard = ({ article, displaySettings = {} }) => {
  if (!article) return null;
  const displayDate = article.original_publication_date || article.created_date;
  const isValidDate = displayDate && !isNaN(new Date(displayDate));

  return (
    <div className="flex-shrink-0 w-full max-w-[320px] mx-2">
      <Link to={createPageUrl(`Article?id=${article.id}`)} className="block group">
        <div className="relative overflow-hidden">
          <img
            src={article.featured_image || `https://picsum.photos/seed/${article.id}/320/180`}
            alt={article.title}
            className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0">
            <div className="bg-black/70 p-4">
                <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 mb-2 group-hover:text-blue-200 transition-colors">
                {article.title}
                </h3>
                
                {/* Display excerpt if enabled */}
                {displaySettings.showExcerpt !== false && article.excerpt && (
                <p className="text-white/80 text-sm mb-2 line-clamp-2">
                    {article.excerpt}
                </p>
                )}
                
                <div className="flex items-center text-white/80 text-sm gap-3">
                {/* Date */}
                {displaySettings.showDate !== false && isValidDate && (
                    <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(displayDate), 'dd/MM/yyyy', { locale: he })}</span>
                    </div>
                )}
                
                {/* Author */}
                {displaySettings.showAuthor !== false && article.author && (
                    <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{article.author}</span>
                    </div>
                )}
                
                {/* Comments */}
                {displaySettings.showComments !== false && (
                    <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>(0)</span>
                    </div>
                )}
                </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default function ArticleSlider({ title, categorySlug, articles, headerStyle, displaySettings = {} }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Default header style if not provided
  const defaultHeaderStyle = {
    type: 'background',
    image_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/a2b1f4156_5.png'
  };
  
  const style = headerStyle || defaultHeaderStyle;

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      updateScrollButtons();
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [articles]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount);
      scrollContainerRef.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    }
  };

  if (!articles || articles.length === 0) return null;

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

      {/* Slider Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
            aria-label="גלול ימינה"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 transition-all"
            aria-label="גלול שמאלה"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
        )}

        {/* Scrollable Articles */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-2 px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} displaySettings={displaySettings} />
          ))}
        </div>
      </div>
    </div>
  );
}