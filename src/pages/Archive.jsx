import { useState, useEffect } from 'react';
import { Article } from '@/entities/Article';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { Loader2, Calendar, Newspaper, Clock, User } from 'lucide-react';
import { Button } from "@/components/ui/button";

const ArchivePage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("ארכיון כללי");

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const year = params.get('year');
      const month = params.get('month');

      let filter = { published: true };

      if (year && month) {
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const endDate = endOfMonth(startDate);
        
        filter = {
            ...filter,
            created_date: {
                $gte: startDate.toISOString(),
                $lte: endDate.toISOString()
            }
        };

        setPageTitle(`ארכיון: ${format(startDate, 'LLLL yyyy', { locale: he })}`);
      } else {
        setPageTitle("כל המאמרים בארכיון");
      }

      try {
        const fetchedArticles = await Article.filter(filter, '-created_date');
        setArticles(fetchedArticles);
      } catch (error) {
        console.error("Error fetching articles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [window.location.search]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-gray-600">טוען מאמרים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Calendar className="w-16 h-16 mx-auto text-blue-600" />
        <h1 className="mt-4 text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
          {pageTitle}
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
          דפדף בין כל הכתבות והמאמרים שפורסמו באתר לאורך הזמן.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map(article => (
            <div key={article.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden flex flex-col">
              <Link to={createPageUrl(`Article?id=${article.id}`)} className="block">
                <img
                  src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/250`}
                  alt={article.title}
                  className="w-full h-56 object-cover"
                />
              </Link>
              <div className="p-6 flex-grow flex flex-col">
                <div className="mb-2">
                  <p className="text-sm text-blue-600 font-semibold uppercase tracking-wide">
                    {article.category || "כללי"}
                  </p>
                </div>
                <Link to={createPageUrl(`Article?id=${article.id}`)} className="block">
                  <h2 className="text-2xl font-bold text-gray-900 hover:text-blue-700 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                </Link>
                <p className="mt-3 text-gray-600 line-clamp-3 flex-grow">
                  {article.excerpt}
                </p>
                <div className="mt-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-2" />
                    <span>{article.author || "מערכת האתר"}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <Clock className="w-4 h-4 mr-2" />
                    <time dateTime={article.created_date}>
                      {format(new Date(article.created_date), 'd בLLLL, yyyy', { locale: he })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-lg">
          <Newspaper className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">לא נמצאו מאמרים</h3>
          <p className="mt-1 text-sm text-gray-500">
            לא נמצאו מאמרים התואמים לתקופה שנבחרה.
          </p>
          <div className="mt-6">
            <Link to={createPageUrl('Home')}>
              <Button>חזור לדף הבית</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivePage;