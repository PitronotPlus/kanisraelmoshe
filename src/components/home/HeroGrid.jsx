
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const ArticleCard = ({ article, className = '', titleSize = 'text-xl', showExcerpt = false }) => (
  <Link
    to={createPageUrl(`Article?id=${article.id}`)}
    className={`hero-card relative block group overflow-hidden ${className}`}
    style={{ borderRadius: 0 }}
  >
    <div className="absolute inset-0">
      <img
        src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/600`}
        alt={article.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        style={{ borderRadius: 0 }}
      />
    </div>
    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
      <div className="bg-black/70 p-3" style={{ borderRadius: 0 }}>
        <h3 className={`font-bold leading-tight text-white ${titleSize}`}>
          {article.title}
        </h3>
        {showExcerpt && article.excerpt && <p className="text-sm mt-2 text-gray-200 hidden sm:block">{article.excerpt}</p>}
      </div>
    </div>
  </Link>
);

export default function HeroGrid({ articles, layout = 'hierarchical-1' }) {
  if (!articles || articles.length === 0) {
    return <div className="text-center py-10">אין מאמרים להצגה באזור זה.</div>;
  }

  const renderLayout = () => {
    switch (layout) {
      case 'hierarchical-1': // 1 big, 4 small
        if (articles.length < 5) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[30rem] md:h-[40rem]">
            <div className="md:col-span-2 md:row-span-2">
              <ArticleCard article={articles[0]} className="w-full h-full" titleSize="text-2xl md:text-3xl" showExcerpt={true} />
            </div>
            <div className="md:col-span-2">
              <ArticleCard article={articles[1]} className="w-full h-full" titleSize="text-lg md:text-xl" />
            </div>
            <div className="md:col-span-1">
              <ArticleCard article={articles[2]} className="w-full h-full" titleSize="text-base md:text-lg" />
            </div>
            <div className="md:col-span-1">
              <ArticleCard article={articles[3]} className="w-full h-full" titleSize="text-base md:text-lg" />
            </div>
          </div>
        );

      case 'hierarchical-2': // 1 big, 2 small
        if (articles.length < 3) return null;
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[30rem]">
            <div className="md:col-span-2">
              <ArticleCard article={articles[0]} className="w-full h-full" titleSize="text-2xl md:text-3xl" showExcerpt={true} />
            </div>
            <div className="grid grid-rows-2 gap-4">
              <ArticleCard article={articles[1]} className="w-full h-full" titleSize="text-lg" />
              <ArticleCard article={articles[2]} className="w-full h-full" titleSize="text-lg" />
            </div>
          </div>
        );

      case 'modular-2x2': // 4 equal
        if (articles.length < 4) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4 h-[30rem] md:h-[40rem]">
            {articles.slice(0, 4).map(article => (
              <ArticleCard key={article.id} article={article} className="w-full h-full min-h-[15rem]" titleSize="text-lg md:text-xl" />
            ))}
          </div>
        );

      case 'column': // 4 columns
        if (articles.length < 4) return null;
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 h-[30rem]">
            {articles.slice(0, 4).map(article => (
              <ArticleCard key={article.id} article={article} className="w-full h-full" titleSize="text-base md:text-lg" />
            ))}
          </div>
        );

      default: // Fallback to hierarchical-1
        if (articles.length < 5) return <ArticleCard article={articles[0]} className="w-full h-[30rem]" titleSize="text-2xl md:text-3xl" showExcerpt={true} />;
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[30rem] md:h-[40rem]">
                <div className="md:col-span-2 md:row-span-2"><ArticleCard article={articles[0]} className="w-full h-full" titleSize="text-2xl md:text-3xl" showExcerpt={true} /></div>
                <div className="md:col-span-2"><ArticleCard article={articles[1]} className="w-full h-full" titleSize="text-lg md:text-xl" /></div>
                <div className="md:col-span-1"><ArticleCard article={articles[2]} className="w-full h-full" titleSize="text-base md:text-lg" /></div>
                <div className="md:col-span-1"><ArticleCard article={articles[3]} className="w-full h-full" titleSize="text-base md:text-lg" /></div>
            </div>
        );
    }
  };

  return <div className="w-full">{renderLayout()}</div>;
}
