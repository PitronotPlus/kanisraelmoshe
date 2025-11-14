
import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from 'lucide-react';

const HeroCard = ({ article, index }) => {
  if (!article) return null;
  const displayDate = article.original_publication_date || article.created_date;
  const isValidDate = displayDate && !isNaN(new Date(displayDate));

  return (
    <Link
      to={createPageUrl(`Article?id=${article.id}`)}
      className="hero-card group relative overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] w-[85vw] sm:w-[320px] h-[480px] flex-shrink-0"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/600`}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading={index < 3 ? 'eager' : 'lazy'}
        />
      </div>

      {/* Multi-layer Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-pink-500/10 opacity-70 group-hover:opacity-90 transition-all duration-500"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-orange-500/20 to-yellow-400/10 opacity-0 group-hover:opacity-60 transition-all duration-700"></div>
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 via-black/30 to-transparent"></div>

      {/* Category Badge */}
      <div className="absolute top-6 right-6 z-30">
        <div className="text-white text-xs font-bold px-3 py-1.5 shadow-lg backdrop-blur-sm border border-white/20" style={{ backgroundColor: '#b4131d' }}>
          {article.category || 'חדשות'}
        </div>
      </div>

      {/* Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
        <h3 className="text-xl font-bold text-white leading-tight mb-3 drop-shadow-2xl group-hover:text-yellow-300 transition-colors duration-300">
          {article.title}
        </h3>
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0 mb-3">
          <p className="text-gray-200 text-sm leading-relaxed line-clamp-3 drop-shadow-lg">
            {article.excerpt || 'פרטים נוספים בכתבה המלאה...'}
          </p>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-300">
          {isValidDate && (
            <span className="font-medium drop-shadow-md">
              {format(new Date(displayDate), 'd MMM, yyyy', { locale: he })}
            </span>
          )}
          {article.author && (
            <span className="opacity-80 drop-shadow-md">
              {article.author}
            </span>
          )}
        </div>
      </div>

      {/* Animated Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/30 transition-all duration-500"></div>
      
      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
    </Link>
  );
};

export default function HeroCards({ articles }) {
  const sliderRef = useRef(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const updateScrollButtons = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isRTL = getComputedStyle(el).direction === 'rtl';

    if (isRTL) {
        const scrollStart = Math.abs(scrollLeft) < 10;
        const scrollEnd = Math.abs(scrollLeft) >= scrollWidth - clientWidth - 10;
        setCanScrollPrev(!scrollEnd);
        setCanScrollNext(!scrollStart);
    } else {
        const scrollStart = scrollLeft < 10;
        const scrollEnd = scrollLeft >= scrollWidth - clientWidth - 10;
        setCanScrollPrev(!scrollStart);
        setCanScrollNext(!scrollEnd);
    }
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      resizeObserver.unobserve(el);
    };
  }, [articles, updateScrollButtons]);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.8;
      const isRTL = getComputedStyle(sliderRef.current).direction === 'rtl';
      const scrollDirection = isRTL ? -direction : direction;
      
      sliderRef.current.scrollBy({
        left: scrollDirection * scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <div className="relative mb-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-blue-50 opacity-50 rounded-3xl"></div>
      
      <div className="relative">
        {/* Main Container for horizontal scrolling */}
        <div ref={sliderRef} className="relative overflow-x-auto py-8 scrollbar-hide">
          <div className="flex gap-6 pb-4 px-4 sm:px-6 lg:px-8">
            {articles.map((article, index) => (
              <HeroCard key={article.id} article={article} index={index} />
            ))}
          </div>
        </div>

        {/* Previous Button */}
        <button
          onClick={() => scroll(-1)}
          disabled={!canScrollNext}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all ${
            !canScrollNext ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'
          }`}
          aria-label="Previous article"
        >
          <ChevronRight className="w-7 h-7 text-gray-800" />
        </button>

        {/* Next Button */}
        <button
          onClick={() => scroll(1)}
          disabled={!canScrollPrev}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/70 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-all ${
            !canScrollPrev ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'
          }`}
          aria-label="Next article"
        >
          <ChevronLeft className="w-7 h-7 text-gray-800" />
        </button>
      </div>
    </div>
  );
}
