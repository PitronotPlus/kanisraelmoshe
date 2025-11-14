
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function SpecialAlert({ article }) {
  // Component now receives the final article object directly
  if (!article) return null;
  const displayDate = article.original_publication_date || article.created_date;
  const isValidDate = displayDate && !isNaN(new Date(displayDate));

  return (
    <div className="mb-8">
      <Link
        to={createPageUrl(`Article?id=${article.id}`)}
        className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 shadow-2xl hover:shadow-3xl transition-all duration-500 block"
      >
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img
            src={article.featured_image || `https://picsum.photos/seed/${article.id}/1200/600`}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
          
          {/* Special alert badge */}
          <div className="absolute top-6 right-6 bg-red-600 text-white px-4 py-2 flex items-center space-x-2 space-x-reverse animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-sm">מבזק מיוחד</span>
          </div>
          
          {/* Animated border */}
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse"></div>
          
          {/* Content */}
          <div className="absolute bottom-0 p-8 text-white max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold text-shadow-lg leading-tight group-hover:text-yellow-300 transition-colors mb-4">
              {article.title}
            </h1>
            
            {article.excerpt && (
              <p className="text-lg md:text-xl text-gray-200 mb-4 leading-relaxed">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center text-sm text-gray-300">
              <Clock className="w-4 h-4 ml-2" />
              {isValidDate && <span>{format(new Date(displayDate), 'dd/MM/yyyy HH:mm', { locale: he })}</span>}
              {article.author && (
                <>
                  <span className="mx-2">•</span>
                  <span>מאת: {article.author}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
