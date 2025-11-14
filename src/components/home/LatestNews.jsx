
import { Clock } from "lucide-react"; // Clock is still used
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const NewsCard = ({ article }) => {
  const displayDate = article.original_publication_date || article.created_date;

  return (
    <Link
      to={createPageUrl(`Article?id=${article.id}`)}
      className="hero-card group block bg-white shadow-sm hover:shadow-lg transition-shadow duration-300 rounded-lg overflow-hidden"
    >
      <div className="flex gap-4 p-4">
        <img
          src={article.featured_image || `https://picsum.photos/seed/${article.id}/300/200`}
          alt={article.title}
          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-grow min-w-0">
          <h3 className="font-bold text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm mt-2 line-clamp-2">{article.excerpt}</p>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <Clock size={12} className="ml-1" />
            <span>{format(new Date(displayDate), 'd MMMM, yyyy', { locale: he })}</span>
            {(article.author || article.created_by) && <span> &middot; {article.author || article.created_by}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function LatestNews({ articles }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">אין חדשות להצגה</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center space-x-4 space-x-reverse">
        <h2 className="text-3xl font-bold text-gray-900">חדשות אחרונות</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-green-500 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 9).map((article) => (
          <NewsCard article={article} key={article.id} />
        ))}
      </div>
    </section>
  );
}
