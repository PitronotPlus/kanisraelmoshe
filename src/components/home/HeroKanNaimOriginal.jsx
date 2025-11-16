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
        <div className="flex-1 min-w-0 text-right">
          <p 
            className="text-sm text-red-600 mb-1"
            style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}
          >
            {format(new Date(displayDate), 'HH:mm dd.MM.yyyy', { locale: he })}
          </p>
          <p 
            className="text-base leading-snug"
            style={{ fontFamily: 'Arial, sans-serif', fontWeight: 'normal' }}
          >
            {article.title}
          </p>
        </div>
        {article.featured_image && (
          <img 
            src={article.featured_image} 
            alt={article.title}
            className="w-20 h-16 object-cover flex-shrink-0"
          />
        )}
      </div>
    </Link>
  );
};

// Main article card
const MainArticleCard = ({ article, categoryName = 'פוליטיקה' }) => {
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
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex justify-start mb-[-1px]">
          <div 
            className="py-1.5 px-3 inline-block"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              minWidth: '120px',
              maxWidth: '35%'
            }}
          >
            <p className="font-bold text-white text-xs">
              {categoryName}
            </p>
          </div>
        </div>
        
        <div className="bg-black/70 p-4">
          <h3 className="font-normal text-white text-xl leading-snug mb-2">
            {article.title}
          </h3>
          
          {article.excerpt && (
            <p className="text-white text-sm leading-relaxed font-normal">
              {article.excerpt}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

// Small article card
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
      
      <div className="absolute bottom-0 left-0 right-0">
        <div 
          className="py-3 px-4"
          style={{
            backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
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
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Grid of posts - בידוד מוחלט בגובה 620px */}
        <div className="hidden lg:block lg:col-span-9 order-1">
          <div className="grid grid-cols-9 gap-4" style={{ height: '620px' }}>
            {/* Two smaller articles - right side */}
            <div className="col-span-4">
              <div className="grid grid-rows-2 gap-4 h-full">
                <SmallArticleCard 
                  article={articles[1]} 
                  label="מתכונים"
                />
                <SmallArticleCard 
                  article={articles[2]} 
                  label="סלבs"
                />
              </div>
            </div>
            
            {/* Main large article - center */}
            <div className="col-span-5 h-full">
              <MainArticleCard article={articles[0]} categoryName="פוליטיקה" />
            </div>
          </div>
        </div>
        
        {/* Sidebar column - ללא רווחים */}
        <div className="hidden lg:flex lg:flex-col lg:col-span-3 order-2">
          {/* Breaking News Sidebar */}
          <div className="bg-white flex flex-col" style={{ height: '485px' }}>
            <div 
              className="py-2 px-4 relative z-10 flex-shrink-0"
              style={{
                width: '45%',
                backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
                backgroundSize: '100% 100%',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                marginBottom: '-1px'
              }}
            >
              <h3 className="text-white text-base font-bold text-right whitespace-nowrap">מבזקים בכאן נעים</h3>
            </div>
            
            <div className="flex-1 border border-gray-300 bg-white overflow-hidden flex flex-col">
              {breakingNews.length > 0 ? (
                <div className="divide-y divide-gray-200 flex-1">
                  {breakingNews.slice(0, 4).map((article, index) => (
                    <div key={article.id} className="flex-1">
                      <BreakingNewsItem article={article} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm flex-1 flex items-center justify-center">
                  אין מבזקים חדשים
                </div>
              )}
            </div>
          </div>
          
          {/* Red email button - מיד אחרי הסיידבר ללא רווח */}
          <a
            href={redMailLink}
            target={redMailLink.startsWith('http') ? '_blank' : undefined}
            rel={redMailLink.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block hover:opacity-90 transition-opacity"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/8491fa781_Screenshot_2.jpg"
              alt="המייל האדום"
              className="w-full block"
              style={{ display: 'block', margin: 0 }}
            />
          </a>
        </div>
      </div>
    </div>
  );
}