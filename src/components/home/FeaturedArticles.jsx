
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, User } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeaturedArticles({ articles }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">אין כתבות מובילות כרגע</p>
      </div>
    );
  }

  const mainArticle = articles[0];
  const sideArticles = articles.slice(1, 3);

  return (
    <section className="space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse">
        <h2 className="text-3xl font-bold text-gray-900">כתבות מובילות</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Featured Article */}
        <Link to={createPageUrl(`Article?id=${mainArticle.id}`)} className="lg:col-span-2">
          <Card className="h-full article-card overflow-hidden transition-all duration-300 hover:shadow-2xl">
            <div className="relative">
              <img 
                src={mainArticle.featured_image || "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=400&fit=crop"} 
                alt={mainArticle.title}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-4 right-4 left-4">
                <Badge className="bg-red-500 text-white mb-2">מובילה</Badge>
                <h3 className="text-2xl font-bold text-white mb-2 text-shadow">
                  {mainArticle.title}
                </h3>
                <p className="text-gray-200 text-sm mb-3 line-clamp-2">
                  {mainArticle.excerpt}
                </p>
                <div className="flex items-center space-x-4 space-x-reverse text-white/80 text-sm">
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <User className="w-4 h-4" />
                    <span>{mainArticle.author || mainArticle.created_by}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(mainArticle.created_date), 'dd/MM/yyyy', { locale: he })}</span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    <Eye className="w-4 h-4" />
                    <span>{mainArticle.views || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>

        {/* Side Articles */}
        <div className="space-y-4">
          {sideArticles.map((article) => (
            <Link to={createPageUrl(`Article?id=${article.id}`)} key={article.id}>
                <Card className="article-card transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex space-x-4 space-x-reverse">
                      <img 
                        src={article.featured_image || "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=200&h=150&fit=crop"} 
                        alt={article.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <Badge className="bg-blue-100 text-blue-800 text-xs mb-1">
                          {article.category}
                        </Badge>
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                          {article.title}
                        </h4>
                        <div className="flex items-center space-x-2 space-x-reverse text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(article.created_date), 'dd/MM', { locale: he })}</span>
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
      </div>
    </section>
  );
}
