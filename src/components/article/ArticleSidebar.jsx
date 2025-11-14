
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rss, TrendingUp, Clock } from 'lucide-react';
import { InvokeLLM } from "@/integrations/Core";
import AdBanner from '../ads/AdBanner';

import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

// Minimal mock for createPageUrl, assuming it generates routes based on some application logic.
// In a real application, this would likely be imported from a routing utility file or context.
const createPageUrl = (path) => {
  // This is a simple placeholder. Actual implementation might involve URL parameters, base paths, etc.
  return path;
};

const GoogleNewsFeed = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoogleNews();
  }, []);

  const formatSourceName = (source) => {
    if (!source) return '';
    // Extracts the source name before any markdown link like "ynet (link)"
    const match = source.match(/^([^([]+)/);
    return match ? match[0].trim() : source;
  };

  const fetchGoogleNews = async () => {
    try {
      const response = await InvokeLLM({
        prompt: "תן לי 5 חדשות אקטואליות מישראל מהיום. עבור כל חדשה תן כותרת קצרה, תיאור של משפט אחד, ואת שם מקור החדשות (לדוגמה: 'ynet') - ללא קישורים. החזר בפורמט JSON",
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  source: { type: "string", description: "שם מקור החדשות בלבד" }
                }
              }
            }
          }
        }
      });
      
      setNews(response.news || []);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback news
      setNews([
        { title: "עדכון שוק ההון", description: "תא שוק ההון סוחר בעליות קלות", source: "כלכליסט" },
        { title: "מזג האוויר השבוע", description: "צפוי מזג אוויר נעים עם שמש", source: "ynet" },
        { title: "חדשות ספורט", description: "הפועל ירושלים זוכה במשחק הערב", source: "ספורט 1" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-red-600 text-white">
        <CardTitle className="flex items-center justify-between text-lg">
          <span>חדשות עדכניות</span>
          <Rss className="w-5 h-5" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 text-center">
            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">טוען חדשות...</p>
          </div>
        ) : (
          <div className="divide-y">
            {news.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <h4 className="font-semibold text-sm text-gray-900 mb-1 leading-tight">
                  {item.title}
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{formatSourceName(item.source)}</span>
                  <Clock className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TrendingTopics = () => {
  const topics = [
    "בחירות 2024", "כלכלת ישראל", "מזג אוויר", "ספורט",
    "טכנולוגיה", "בריאות", "תרבות", "נדלן"
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <TrendingUp className="w-5 h-5 ml-2 text-orange-500" />
          נושאים חמים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <Badge 
              key={topic} 
              variant="outline" 
              className="text-xs cursor-pointer hover:bg-gray-100"
            >
              {topic}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const WeatherWidget = () => (
  <Card className="shadow-lg">
    <CardHeader className="bg-blue-500 text-white">
      <CardTitle className="text-lg">מזג האוויר היום</CardTitle>
    </CardHeader>
    <CardContent className="p-4">
      <div className="text-center">
        <div className="text-3xl font-bold text-blue-600 mb-2">24°</div>
        <p className="text-sm text-gray-600">שמיים בהירים</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div>מקסימום: 26°</div>
          <div>מינימום: 18°</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const RelatedArticles = ({ currentArticleId, categorySlug }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      setLoading(true);
      try {
        const response = await InvokeLLM({
          prompt: `Find 3-5 articles related to article ID "${currentArticleId}" in category "${categorySlug}". For each article, provide its unique ID, a short title, a URL for a featured image (if available, otherwise null), and its publication date (prefer 'original_publication_date' if available, otherwise 'created_date'). Return in JSON format.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              articles: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    featured_image: { type: "string", nullable: true },
                    original_publication_date: { type: "string", format: "date-time" },
                    created_date: { type: "string", format: "date-time" }
                  },
                  required: ["id", "title"] // id and title are essential, date/image might be optional based on LLM response
                }
              }
            }
          }
        });

        if (response && response.articles) {
          // Filter out the current article if it somehow appears in related articles
          const filteredArticles = response.articles.filter(
            (article) => article.id !== currentArticleId
          );
          setArticles(filteredArticles.slice(0, 5)); // Limit to max 5 related articles
        }
      } catch (error) {
        console.error('Error fetching related articles:', error);
        // Fallback for related articles if API fails
        setArticles([
          { id: 'mock-1', title: 'מאמר מומלץ: חדשנות בטכנולוגיה', featured_image: null, original_publication_date: new Date(2023, 10, 15).toISOString() },
          { id: 'mock-2', title: 'ניתוח שוק הנדל"ן 2024', featured_image: null, original_publication_date: new Date(2023, 9, 20).toISOString() },
          { id: 'mock-3', title: 'טיפים לחיים בריאים יותר', featured_image: null, original_publication_date: new Date(2023, 11, 1).toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if currentArticleId and categorySlug are provided
    if (currentArticleId && categorySlug) {
      fetchRelatedArticles();
    } else {
      setLoading(false); // If no context, don't show loading indefinitely
    }
  }, [currentArticleId, categorySlug]);

  if (!currentArticleId || !categorySlug) {
    return null; // Don't render if no context for related articles
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">מאמרים קשורים</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">טוען מאמרים...</p>
          </div>
        ) : (
          <div className="divide-y">
            {articles.length > 0 ? (
              articles.map((article) => (
                <Link 
                  key={article.id} 
                  to={createPageUrl(`Article?id=${article.id}`)} 
                  className="group flex items-start p-4 hover:bg-gray-50 transition-colors space-x-3 space-x-reverse"
                >
                  <img 
                    src={article.featured_image || `https://picsum.photos/seed/${article.id}/100/75`} 
                    alt={article.title} 
                    className="w-24 h-16 object-cover rounded-md flex-shrink-0" 
                  />
                  <div className="flex-grow">
                    <h4 className="text-sm font-semibold leading-tight group-hover:text-blue-600">{article.title}</h4>
                    <span className="text-xs text-gray-500">
                      {format(new Date(article.original_publication_date || article.created_date || new Date()), 'd MMM', { locale: he })}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500 text-center">לא נמצאו מאמרים קשורים.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ArticleSidebar({ ads, currentArticleId, categorySlug }) {
  return (
    <div className="space-y-6 sticky top-24">
      <GoogleNewsFeed />
      
      {/* New Related Articles section */}
      <RelatedArticles currentArticleId={currentArticleId} categorySlug={categorySlug} />

      <AdBanner ads={ads} />
      
      <TrendingTopics />
      
      <WeatherWidget />
      
      {/* Additional Ad Space */}
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 p-6 text-center rounded-lg">
        <div className="text-gray-500 text-sm">
          <div className="font-medium mb-1">מקום לפרסומת</div>
          <div className="text-xs">300x250</div>
        </div>
      </div>
    </div>
  );
}
