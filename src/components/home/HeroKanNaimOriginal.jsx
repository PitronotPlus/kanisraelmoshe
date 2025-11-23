import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Breaking news item component
const BreakingNewsItem = ({ article, isLast }) => {
  const displayDate = article.original_publication_date || article.created_date;
  
  return (
    <Link 
      to={createPageUrl(`Article?id=${article.id}`)}
      className="block hover:bg-gray-50 transition-colors"
    >
      <div className={`flex items-start space-x-3 space-x-reverse ${isLast ? 'p-3 pb-0' : 'p-3'}`}>
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
      
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex justify-start mb-[-1px]">
          <div 
            className="py-2 px-4 inline-block"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              minWidth: '120px',
              maxWidth: '35%'
            }}
          >
            <p className="font-bold text-white text-lg">
              {categoryName}
            </p>
          </div>
        </div>
        
        <div className="bg-black/50 p-5">
          <h3 className="font-bold text-white text-2xl leading-tight mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
            {article.title}
          </h3>
          
          {article.excerpt && (
            <p 
              className="text-white text-base leading-relaxed font-normal" 
              style={{ 
                textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
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
      
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex justify-start mb-[-1px]">
          <div 
            className="py-1.5 px-3 inline-block"
            style={{
              backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
              backgroundSize: '100% 100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              minWidth: '80px',
              maxWidth: '40%'
            }}
          >
            <p className="font-bold text-white text-sm whitespace-nowrap">
              {label}
            </p>
          </div>
        </div>
        
        <div className="bg-black/50 p-3">
          <h3 className="font-bold text-white text-lg leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
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
      <style>
        {`
          @media (min-width: 1024px) {
            .hero-grid-container {
              display: grid;
              grid-template-columns: repeat(12, minmax(0, 1fr));
              gap: 1rem;
            }
            
            .hero-posts-grid {
              grid-column: span 9 / span 9;
              height: 455px;
            }
            
            .hero-sidebar {
              grid-column: span 3 / span 3;
              height: 455px;
            }
            
            .breaking-news-section {
              height: 320px;
            }
            
            .red-mail-button {
              height: 135px;
            }
          }
          
          @media (min-width: 1280px) {
            .hero-posts-grid {
              height: 480px;
            }
            
            .hero-sidebar {
              height: 480px;
            }
            
            .breaking-news-section {
              height: 345px;
            }
          }
          
          @media (min-width: 1536px) {
            .hero-posts-grid {
              height: 485px;
            }
            
            .hero-sidebar {
              height: 485px;
            }
            
            .breaking-news-section {
              height: 350px;
            }
          }
        `}
      </style>
      
      <div className="hero-grid-container grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Mobile View - Stack articles vertically */}
        <div className="lg:hidden space-y-4">
          {/* Main article on mobile */}
          <div className="h-64">
            <MainArticleCard article={articles[0]} categoryName="פוליטיקה" />
          </div>
          
          {/* Two smaller articles on mobile */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-48">
              <SmallArticleCard 
                article={articles[1]} 
                label="מתכונים"
              />
            </div>
            <div className="h-48">
              <SmallArticleCard 
                article={articles[2]} 
                label="סלבs"
              />
            </div>
          </div>
          
          {/* Breaking news on mobile */}
          {breakingNews.length > 0 && (
            <div className="bg-white">
              <div 
                className="py-2 px-4 relative z-10 inline-block"
                style={{
                  width: '45%',
                  backgroundImage: 'url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/1ac382c6e_5.png)',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  marginBottom: '-1px'
                }}
              >
                <h3 className="text-white text-sm font-bold whitespace-nowrap">מבזקים</h3>
              </div>
              
              <div className="border border-gray-300 bg-white divide-y divide-gray-200">
                {breakingNews.slice(0, 3).map((article) => (
                  <BreakingNewsItem key={article.id} article={article} isLast={false} />
                ))}
              </div>
            </div>
          )}
          
          {/* Red mail button on mobile */}
          <a
            href={redMailLink}
            target={redMailLink.startsWith('http') ? '_blank' : undefined}
            rel={redMailLink.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="block hover:opacity-90 transition-opacity"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/8491fa781_Screenshot_2.jpg"
              alt="המייל האדום"
              className="w-full h-32 object-contain"
            />
          </a>
        </div>
        
        {/* Desktop View - Grid of posts */}
        <div className="hidden lg:block hero-posts-grid order-1">
          <div className="grid grid-cols-9 gap-4 h-full">
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
        
        {/* Desktop Sidebar column */}
        <div className="hidden lg:block hero-sidebar order-2">
          <div className="flex flex-col h-full">
            {/* Breaking News Sidebar */}
            <div className="bg-white flex flex-col breaking-news-section">
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
                  <div className="divide-y divide-gray-200 flex-1 flex flex-col">
                    {breakingNews.slice(0, 4).map((article, index) => (
                      <div key={article.id} className="flex-1">
                        <BreakingNewsItem article={article} isLast={index === 3 || index === breakingNews.slice(0, 4).length - 1} />
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
            
            {/* Red email button */}
            <a
              href={redMailLink}
              target={redMailLink.startsWith('http') ? '_blank' : undefined}
              rel={redMailLink.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="hover:opacity-90 transition-opacity red-mail-button"
              style={{ display: 'block', lineHeight: 0 }}
            >
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/8491fa781_Screenshot_2.jpg"
                alt="המייל האדום"
                style={{ width: '100%', height: '100%', display: 'block', margin: 0, padding: 0, objectFit: 'contain' }}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}