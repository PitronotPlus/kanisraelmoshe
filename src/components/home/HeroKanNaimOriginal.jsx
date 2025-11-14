import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Breaking news item component
const BreakingNewsItem = ({ article }) => {
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
            className="w-20 h-16 object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-base text-red-600 font-normal mb-1 text-right">
            {format(new Date(displayDate), 'HH:mm dd.MM.yyyy', { locale: he })}
          </div>
          <h4 className="text-base font-normal leading-snug text-right">
            {article.title}
          </h4>
        </div>
      </div>
    </Link>
  );
};

// Main article card with ribbon title and "פוליטיקה" label
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
      
      {/* Dark overlay gradient only at bottom */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      
      {/* פוליטיקה label at top right */}
      <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 font-normal text-base z-20">
        פוליטיקה
      </div>
      
      {/* Content at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        {/* Title with ribbon background */}
        <div 
          className="relative mb-3 py-3 px-4"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h3 className="font-normal text-white text-xl leading-snug">
            {article.title}
          </h3>
        </div>
        
        {/* Description with semi-transparent background */}
        {article.excerpt && (
          <div className="bg-black/60 p-3">
            <p className="text-white text-sm leading-relaxed font-normal">
              {article.excerpt}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
};

// Small article card - רק תגית למעלה וכותרת עם רקע אדום למטה
const SmallArticleCard = ({ article, label }) => {
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
      
      {/* Label badge at top right - NO dark overlay */}
      <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 font-normal text-base z-10">
        {label}
      </div>
      
      {/* Title at bottom with red background */}
      <div className="absolute bottom-0 left-0 right-0">
        <div 
          className="py-3 px-4"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <h3 className="font-normal text-white text-base leading-snug">
            {article.title}
          </h3>
        </div>
      </div>
    </Link>
  );
};

export default function HeroKanNaimOriginal({ articles, breakingNews = [], redMailLink = 'mailto:kanisraelnews@gmail.com' }) {
  if (!articles || articles.length < 3) {
    return <div className="text-center py-10">אין מספיק מאמרים להצגה באזור זה.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Two smaller articles (Right side) */}
        <div className="lg:col-span-4 order-1">
          <div className="grid grid-rows-2 gap-4 h-[600px]">
            <SmallArticleCard 
              article={articles[1]} 
              label="מתכונים"
            />
            <SmallArticleCard 
              article={articles[2]} 
              label="סלבס"
            />
          </div>
        </div>
        
        {/* Main large article (Center) */}
        <div className="lg:col-span-5 order-2 h-[600px]">
          <MainArticleCard article={articles[0]} />
        </div>
        
        {/* Sidebar - Breaking News (Left side) */}
        <div className="lg:col-span-3 order-3">
          <div className="bg-white h-[600px] flex flex-col">
            {/* Header with red background - with white margin */}
            <div className="p-3">
              <div 
                className="py-3 px-4"
                style={{
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <h3 className="text-white text-lg font-normal text-center">מבזקים בכאן נעים</h3>
              </div>
            </div>
            
            {/* Breaking news list */}
            <div className="flex-1 overflow-y-auto">
              {breakingNews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {breakingNews.map((article) => (
                    <BreakingNewsItem 
                      key={article.id} 
                      article={article}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  אין מבזקים חדשים
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Red email button - below sidebar */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-start-10 lg:col-span-3">
          <a
            href={redMailLink}
            target={redMailLink.startsWith('http') ? '_blank' : undefined}
            rel={redMailLink.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block hover:opacity-90 transition-opacity"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/8491fa781_Screenshot_2.jpg"
              alt="המייל האדום"
              className="w-full"
            />
          </a>
        </div>
      </div>
    </div>
  );
}