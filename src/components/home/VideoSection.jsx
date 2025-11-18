import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play, ChevronRight, ChevronLeft } from "lucide-react";

export default function VideoSection({ articles = [], title = "חדשות" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  if (!articles || articles.length === 0) {
    return null;
  }

  const itemsPerView = 4;
  const maxIndex = Math.max(0, articles.length - itemsPerView);

  const scrollTo = (direction) => {
    if (direction === 'next' && currentIndex < maxIndex) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
      <div className="relative bg-gray-200 p-4 rounded-lg">
        {/* Previous Button */}
        <button
          onClick={() => scrollTo('prev')}
          disabled={currentIndex === 0}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#153b79] hover:bg-[#1a4a99] disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-r-none rounded-l-lg shadow-lg transition-colors"
          style={{ transform: 'translate(0, -50%)' }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Next Button */}
        <button
          onClick={() => scrollTo('next')}
          disabled={currentIndex >= maxIndex}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-l-none rounded-r-lg shadow-lg transition-colors"
          style={{ transform: 'translate(0, -50%)' }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Video Grid */}
        <div className="overflow-hidden px-12">
          <div 
            ref={scrollContainerRef}
            className="grid grid-cols-4 gap-4 transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(${currentIndex * -25}%)` }}
          >
            {articles.map((article) => (
              <Link
                key={article.id}
                to={createPageUrl(`Article?id=${article.id}`)}
                className="group block"
              >
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-2 border-2 border-black">
                  {/* Video Thumbnail */}
                  <img
                    src={article.video_thumbnail || article.featured_image || `https://picsum.photos/seed/${article.id}/400/225`}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-600 rounded-full p-3 group-hover:bg-red-700 transition-colors shadow-lg">
                      <Play className="w-6 h-6 text-white fill-white" />
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-base font-bold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}