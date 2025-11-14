import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Breaking news item component
const BreakingNewsItem = ({ article, index }) => {
  const displayDate = article.original_publication_date || article.created_date;
  
  return (
    <Link 
      to={createPageUrl(`Article?id=${article.id}`)}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start space-x-3 space-x-reverse p-3">
        {article.featured_image && (
          <img 
            src={article.featured_image} 
            alt={article.title}
            className="w-12 h-12 object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-red-600 font-bold mb-1">
            {format(new Date(displayDate), 'HH:mm dd.MM.yyyy', { locale: he })}
          </div>
          <h4 className="text-sm font-bold leading-tight line-clamp-2">
            {article.title}
          </h4>
        </div>
      </div>
    </Link>
  );
};

// Main article card with ribbon title
const MainArticleCard = ({ article }) => {
  return (
    <Link
      to={createPageUrl(`Article?id=${article.id}`)}
      className="relative block group overflow-hidden h-full"
    >
      <div className="absolute inset-0">
        <img
          src={article.featured_image || `https://picsum.photos/seed/${article.id}/800/600`}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        {/* Ribbon background for title */}
        <div 
          className="relative mb-4"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/4293514a5_5.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '12px 20px'
          }}
        >
          <h3 className="font-bold text-white text-2xl md:text-3xl leading-tight">
            {article.title}
          </h3>
        </div>
        
        {/* Description with semi-transparent background */}
        {article.excerpt && (
          <div className="bg-black/60 p-3 rounded">
            <p className="text-white text-sm md:text-base leading-relaxed">
              {article.excerpt}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

// Small article card
const SmallArticleCard = ({ article, label, labelColor = 'bg-red-600' }) => {
  return (
    <Link
      to={createPageUrl(`Article?id=${article.id}`)}
      className="relative block group overflow-hidden h-full"
    >
      <div className="absolute inset-0">
        <img
          src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/300`}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
      
      {/* Label badge */}
      {label && (
        <div className={`absolute top-4 right-4 ${labelColor} text-white px-3 py-1 font-bold text-sm z-10`}>
          {label}
        </div>
      )}
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="font-bold text-white text-lg md:text-xl leading-tight">
          {article.title}
        </h3>
      </div>
    </Link>
  );
};

export default function HeroKanNaimOriginal({ articles, breakingNews = [] }) {
  if (!articles || articles.length < 3) {
    return <div className="text-center py-10">אין מספיק מאמרים להצגה באזור זה.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Main Content Area - 3 Articles */}
      <div className="lg:col-span-9">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
          {/* Large main article */}
          <div className="h-full">
            <MainArticleCard article={articles[0]} />
          </div>
          
          {/* Two smaller articles stacked */}
          <div className="grid grid-rows-2 gap-4 h-full">
            <SmallArticleCard 
              article={articles[1]} 
              label="מתכונים" 
              labelColor="bg-red-600"
            />
            <SmallArticleCard 
              article={articles[2]} 
              label="סלבס" 
              labelColor="bg-red-600"
            />
          </div>
        </div>
      </div>
      
      {/* Sidebar - Breaking News */}
      <div className="lg:col-span-3">
        <div className="bg-white border border-gray-200 h-full flex flex-col">
          {/* Header */}
          <div className="bg-red-600 text-white py-3 px-4">
            <h3 className="font-bold text-lg text-center">מבזקים בכאן נעים</h3>
          </div>
          
          {/* Breaking news list */}
          <div className="flex-1 overflow-y-auto">
            {breakingNews.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {breakingNews.map((article, index) => (
                  <BreakingNewsItem 
                    key={article.id} 
                    article={article} 
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                אין מבזקים חדשים
              </div>
            )}
          </div>
          
          {/* Red email button */}
          <div className="p-4 border-t border-gray-200">
            <a
              href="mailto:kanisraelnews@gmail.com"
              className="block bg-red-600 hover:bg-red-700 text-white py-3 px-4 text-center font-bold transition-colors"
            >
              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                <Mail className="w-5 h-5" />
                <span className="text-sm">יש לך ידיעה / תמונה / סרט?</span>
              </div>
              <div className="text-xs mt-1">המייל האדום</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}