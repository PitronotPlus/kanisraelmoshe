import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Flame, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

const HotArticleCard = ({ article, hotArticle, index, layout }) => {
  const getGridClasses = (index, layout) => {
    switch (layout) {
      case 'hero_3':
        if (index === 0) return "lg:col-span-2 lg:row-span-2";
        return "lg:col-span-1 lg:row-span-1";
      case 'mosaic_4':
        if (index === 0) return "md:col-span-2 md:row-span-2";
        return "md:col-span-1 md:row-span-1";
      case 'grid_6':
        return "lg:col-span-1";
      default:
        return "lg:col-span-1";
    }
  };

  const getTitleSize = (index, layout) => {
    if ((layout === 'hero_3' || layout === 'mosaic_4') && index === 0) {
      return "text-xl md:text-2xl font-bold";
    }
    return "text-lg font-bold";
  };

  return (
    <Link
      to={createPageUrl(`Article?id=${article.id}`)}
      className={`group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 h-64 lg:h-full ${getGridClasses(index, layout)}`}
    >
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={hotArticle.custom_image || article.featured_image || `https://picsum.photos/seed/${article.id}/600/400`}
          alt={hotArticle.custom_title || article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
        <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full flex items-center space-x-1 space-x-reverse">
          <Flame className="w-3 h-3" />
          <span className="text-xs font-semibold">חם</span>
        </div>
      </div>
      
      <div className="absolute bottom-0 p-4 text-white">
        <h3 className={`${getTitleSize(index, layout)} text-shadow-lg leading-tight group-hover:text-yellow-300 transition-colors mb-2`}>
          {hotArticle.custom_title || article.title}
        </h3>
        <div className="flex items-center text-xs text-gray-300">
          <Clock className="w-3 h-3 ml-1" />
          <span>{format(new Date(article.created_date), 'dd/MM/yyyy', { locale: he })}</span>
        </div>
      </div>
    </Link>
  );
};

export default function HotArticlesGrid({ articles, hotArticles, category, layout = 'hero_3' }) {
  if (!hotArticles || hotArticles.length === 0) return null;

  // --- START OF FIX ---
  // Slice the articles array to match the number the layout is designed for.
  // This prevents the grid from breaking when more articles are available.
  let visibleHotArticles = hotArticles;
  switch(layout) {
    case 'hero_3':
      visibleHotArticles = hotArticles.slice(0, 3);
      break;
    case 'mosaic_4':
      visibleHotArticles = hotArticles.slice(0, 4);
      break;
    case 'grid_6':
      visibleHotArticles = hotArticles.slice(0, 6);
      break;
  }
  // --- END OF FIX ---
  
  const getContainerClasses = (layout) => {
    switch (layout) {
      case 'hero_3':
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:h-[400px]";
      case 'mosaic_4':
        return "grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[350px]";
      case 'grid_6':
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center space-x-2 space-x-reverse mb-4">
        <Flame className="w-5 h-5 text-red-500" />
        <h3 className="text-xl font-bold text-gray-900">הנושאים החמים ב{category}</h3>
      </div>
      
      <div className={getContainerClasses(layout)}>
        {/* Use the sliced 'visibleHotArticles' array for mapping */}
        {visibleHotArticles.map((hotArticle, index) => {
          const article = articles.find(a => a.id === hotArticle.article_id);
          if (!article) return null;
          
          return (
            <HotArticleCard
              key={hotArticle.id}
              article={article}
              hotArticle={hotArticle}
              index={index}
              layout={layout}
            />
          );
        })}
      </div>
    </div>
  );
}