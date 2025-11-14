import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, RefreshCw, Clock } from 'lucide-react';

export default function SportsFlash() {
  const [sportsNews, setSportsNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSportsNews();
    // רענון כל 3 דקות
    const interval = setInterval(fetchSportsNews, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSportsNews = async () => {
    try {
      setLoading(true);
      
      // משיכת RSS מ-One.co.il
      const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.one.co.il/rss/');
      
      if (!response.ok) {
        throw new Error('Failed to fetch RSS feed');
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok' || !data.items) {
        throw new Error('Invalid RSS data');
      }
      
      // עיבוד המבזקים - לקיחת 5 הראשונים
      const formattedNews = data.items.slice(0, 5).map((item, index) => ({
        id: index,
        title: item.title,
        description: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 100) : '',
        pubDate: new Date(item.pubDate)
      }));
      
      setSportsNews(formattedNews);
      setError(null);
    } catch (err) {
      console.error('Error fetching sports news:', err);
      setError('שגיאה בטעינת חדשות הספורט');
      setSportsNews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `לפני ${diffInMinutes} דקות`;
    } else if (diffInMinutes < 1440) {
      return `לפני ${Math.floor(diffInMinutes / 60)} שעות`;
    } else {
      return `לפני ${Math.floor(diffInMinutes / 1440)} ימים`;
    }
  };

  return (
    <div className="mb-8">
      <div className="bg-green-600 text-white py-3 px-4 mb-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <Zap className="w-5 h-5" />
            <h2 className="text-lg font-bold">מבזקי ספורט</h2>
            <Badge variant="secondary" className="bg-green-500 text-white">
              חי
            </Badge>
          </div>
          <button 
            onClick={fetchSportsNews}
            disabled={loading}
            className="text-white hover:text-green-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <Card className="bg-white border-t-0 rounded-t-none shadow-lg">
        <div className="p-4">
          {loading && sportsNews.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">טוען חדשות ספורט...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchSportsNews}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                נסה שוב
              </button>
            </div>
          ) : sportsNews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">אין עדיין מבזקי ספורט.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sportsNews.map((news) => (
                <div 
                  key={news.id} 
                  className="flex items-start space-x-4 space-x-reverse p-3 rounded-lg bg-gray-50"
                >
                  <div className="bg-green-100 text-green-600 p-2 rounded-full flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse mb-1">
                      <Badge variant="outline" className="text-xs">
                        ספורט
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 ml-1" />
                        {formatTime(news.pubDate)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight mb-1">
                      {news.title}
                    </h3>
                    {news.description && (
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {news.description}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}