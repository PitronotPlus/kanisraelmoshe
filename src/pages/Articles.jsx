
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Article } from "@/entities/Article";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, User, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadArticles(1, true);
  }, []);

  const loadArticles = async (pageNum, reset = false) => {
    setLoading(true);
    try {
      const articlesPerPage = 9;
      const data = await Article.filter(
        { published: true }, 
        '-created_date', 
        articlesPerPage, 
        (pageNum - 1) * articlesPerPage
      );
      
      if (data.length < articlesPerPage) {
        setHasMore(false);
      }
      
      setArticles(prev => reset ? data : [...prev, ...data]);
      setPage(pageNum);

    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Newspaper className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">כל הכתבות</h1>
          <p className="text-gray-600">התעדכנו בכל מה שחדש</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Link to={createPageUrl(`Article?id=${article.id}`)} key={article.id}>
            <Card className="h-full article-card transition-all duration-300 hover:shadow-lg group">
              <div className="relative overflow-hidden">
                <img 
                  src={article.featured_image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop"} 
                  alt={article.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 text-gray-800 text-xs">
                    {article.category}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="w-3 h-3" />
                    <span>{article.author || 'צוות כאן ישראל'}</span>
                  </div>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(article.created_date), 'dd/MM', { locale: he })}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Eye className="w-3 h-3" />
                      <span>{article.views || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      )}

      {hasMore && !loading && (
        <div className="text-center">
          <Button onClick={() => loadArticles(page + 1)}>טען עוד כתבות</Button>
        </div>
      )}

      {!hasMore && (
         <div className="text-center text-gray-500 py-4">
            הגעת לסוף.
         </div>
      )}
    </div>
  );
}
