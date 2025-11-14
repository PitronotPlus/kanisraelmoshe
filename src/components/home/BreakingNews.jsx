import React, { useState, useEffect } from 'react';
import { InvokeLLM } from "@/integrations/Core";

export default function BreakingNews() {
  const [breakingNews, setBreakingNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/www\.[^\s]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    const loadBreakingNews = async () => {
      setLoading(true);
      const cacheKey = 'breakingNewsCache';
      const cachedData = localStorage.getItem(cacheKey);
      const now = new Date().getTime();

      if (cachedData) {
        try {
          const { timestamp, news } = JSON.parse(cachedData);
          if (now - timestamp < 15 * 60 * 1000) {
            setBreakingNews(news);
            setLoading(false);
            return;
          }
        } catch (e) {
            console.warn("Invalid cached breaking news data, clearing cache:", e);
            localStorage.removeItem(cacheKey);
        }
      }

      try {
        const response = await InvokeLLM({
          prompt: "תן לי 3 חדשות חמות ואקטואליות מישראל מהיום. עבור כל חדשה תן רק כותרת קצרה. החזר בפורמט JSON נקי",
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              news: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" }
                  }
                }
              }
            },
            required: ["news"]
          }
        });
        
        const cleanedNews = (response.news || []).map(item => ({
          title: cleanText(item.title)
        })).filter(item => item.title);
        
        if (cleanedNews.length > 0) {
            setBreakingNews(cleanedNews);
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, news: cleanedNews }));
        } else {
            setBreakingNews([{ title: "עוקבים אחר החדשות העדכניות ביותר" }]);
        }

      } catch (error) {
        console.error('Error loading breaking news:', error);
        setBreakingNews([
          { title: "כאן ישראל - מביא לכם את החדשות החמות" }
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    loadBreakingNews();
  }, []);

  const SkeletonLoader = () => (
    <div className="flex space-x-8 space-x-reverse"> 
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center flex-shrink-0">
                <div className="h-4 bg-gray-400/50 rounded w-48 animate-pulse"></div>
                <span className="mx-4 text-red-600 font-bold">|</span>
            </div>
        ))}
    </div>
  );

  return (
    <div className="bg-white py-3 mb-6 border-y border-l border-r border-gray-200" style={{ contain: 'layout style paint' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center">
          <div className="bg-red-600 text-white px-4 py-1 font-bold text-base rounded ml-4">
            הודעות:
          </div>
          <div className="breaking-news-container flex-1">
            <div className="breaking-news-scroll flex space-x-8 space-x-reverse">
              {loading ? (
                <SkeletonLoader />
              ) : (
                <>
                  {breakingNews.map((item, index) => (
                    <React.Fragment key={index}>
                      <span className="flex-shrink-0 text-base font-semibold text-gray-900">
                        {item.title}
                      </span>
                      {index < breakingNews.length - 1 && (
                        <span className="text-red-600 font-bold mx-4">|</span>
                      )}
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}