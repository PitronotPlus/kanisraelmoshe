
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function RelatedArticles({ articles }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold mb-4">כתבות נוספות</h3>
      <div className="space-y-4">
        {articles.map((article) => {
          const displayDate = article.original_publication_date || article.created_date;
          // Add robust date checking to prevent crashes
          const isValidDate = displayDate && !isNaN(new Date(displayDate));

          return (
            <Link 
              to={createPageUrl(`Article?id=${article.id}`)} 
              key={article.id} 
              className="block hover:bg-gray-50 p-3 transition-colors"
            >
              <h4 className="font-semibold text-gray-800">{article.title}</h4>
              <p className="text-xs text-gray-500 mt-1">
                {isValidDate ? format(new Date(displayDate), 'd בMMMM, yyyy', { locale: he }) : ''}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
