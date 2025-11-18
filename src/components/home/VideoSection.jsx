import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play, ChevronRight, ChevronLeft } from "lucide-react";

export default function VideoSection({ articles = [], title = "חדשות" }) {
  const [startIndex, setStartIndex] = useState(0);

  if (!articles || articles.length === 0) {
    return null;
  }

  const totalArticles = articles.length;
  const articlesPerPage = 10; // 4 in first row + 6 in second row
  const canGoNext = startIndex + articlesPerPage < totalArticles;
  const canGoPrev = startIndex > 0;

  const visibleArticles = articles.slice(startIndex, startIndex + articlesPerPage);
  const topRowArticles = visibleArticles.slice(0, 4);
  const bottomRowArticles = visibleArticles.slice(4, 10);

  const scrollNext = () => {
    if (canGoNext) {
      setStartIndex(startIndex + articlesPerPage);
    }
  };

  const scrollPrev = () => {
    if (canGoPrev) {
      setStartIndex(Math.max(0, startIndex - articlesPerPage));
    }
  };

  return (
    <div className="w-full mb-12">
      {/* Section Header */}
      <div className="herald-mod-wrap mb-6">
        <div className="herald-mod-head relative">
          <div className="flex justify-between items-end">
            <div className="flex z-10">
              <div className="w-2 bg-red-600"></div>
              <h2 
                className="text-white font-bold text-xl px-6 py-3 rounded-tl-lg m-0"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/5c071f448_2.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {title}
              </h2>
            </div>
          </div>
          <div className="flex h-1 mt-[-1px]">
            <div className="w-2 bg-red-600"></div>
            <div 
              className="flex-1"
              style={{
                backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/5c071f448_2.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Video Carousel with Gray Background */}
      <div className="relative bg-gray-200 py-6 px-4 rounded-lg">
        {/* Previous Button - Right side with half circle */}
        <button
          onClick={scrollPrev}
          disabled={!canGoPrev}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#153b79] hover:bg-[#1a4a99] disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-4 shadow-lg transition-colors"
          style={{ borderRadius: '0 50% 50% 0' }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Next Button - Left side with half circle */}
        <button
          onClick={scrollNext}
          disabled={!canGoNext}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-4 shadow-lg transition-colors"
          style={{ borderRadius: '50% 0 0 50%' }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="px-8 md:px-12">
          {/* Top Row - 4 Large Videos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {topRowArticles.map((article) => (
              <Link
                key={article.id}
                to={createPageUrl(`Article?id=${article.id}`)}
                className="group block"
              >
                <div className="relative aspect-video bg-black overflow-hidden mb-2">
                  <img
                    src={article.video_thumbnail || article.featured_image || `https://picsum.photos/seed/${article.id}/400/225`}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 rounded-full p-3 shadow-lg">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
                
                <h3 className="text-sm md:text-base font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-center">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>

          {/* Bottom Row - 6 Smaller Videos with Darker Background */}
          {bottomRowArticles.length > 0 && (
            <div className="bg-gray-300 rounded-lg p-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {bottomRowArticles.map((article) => (
                  <Link
                    key={article.id}
                    to={createPageUrl(`Article?id=${article.id}`)}
                    className="group block"
                  >
                    <div className="relative aspect-video bg-black overflow-hidden mb-2">
                      <img
                        src={article.video_thumbnail || article.featured_image || `https://picsum.photos/seed/${article.id}/400/225`}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600 rounded-full p-2 shadow-lg">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xs md:text-sm font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 text-center">
                      {article.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}