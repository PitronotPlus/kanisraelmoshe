
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Article } from '@/entities/Article';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Clock, Loader2, Search as SearchIcon } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { searchArticles } from '@/functions/searchArticles'; // Import the new function

const ArticleCard = ({ article }) => {
  const displayDate = article.original_publication_date || article.created_date;
  
  return (
    <Link to={createPageUrl(`Article?id=${article.id}`)} className="block group mb-6">
      <div className="flex flex-col md:flex-row gap-4 bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <img
          src={article.featured_image || `https://picsum.photos/seed/${article.id}/400/250`}
          alt={article.title}
          className="w-full md:w-1/3 h-auto object-cover aspect-video md:aspect-auto"
        />
        <div className="p-4 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg leading-tight group-hover:text-blue-700">{article.title}</h3>
            <p className="text-sm text-gray-600 mt-2 line-clamp-3">{article.excerpt || ''}</p>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-4">
            <Clock size={14} className="ml-1" />
            <span>{format(new Date(displayDate), 'd MMMM yyyy', { locale: he })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function Search() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [author, setAuthor] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const urlParams = new URLSearchParams(location.search);
      const queryParam = urlParams.get('q');
      const authorId = urlParams.get('author_id');

      try {
        let searchResults = [];
        let displayTitle = '';

        if (authorId) {
          // Search by author ID - this logic remains the same
          try {
            const userData = await User.me().catch(() => null);
            if (userData?.role === 'admin') {
              const authorData = await User.filter({ id: authorId });
              if (authorData.length > 0) {
                setAuthor(authorData[0]);
                displayTitle = `כתבות מאת: ${authorData[0].display_name || authorData[0].full_name}`;
              }
            } else {
              displayTitle = 'כתבות מאת מחבר';
            }
            
            const articles = await Article.filter({ 
              author_user_id: authorId, 
              published: true 
            }, '-created_date', 50);
            searchResults = articles;
          } catch (error) {
            console.error("Failed to fetch articles by author", error);
            displayTitle = 'כתבות מאת מחבר לא ידוע';
            searchResults = [];
          }
        } else if (queryParam) {
          // Search by query text using the new backend function
          displayTitle = `תוצאות חיפוש עבור: "${queryParam}"`;
          setAuthor(null);
          
          try {
            const { data, error } = await searchArticles({ query: queryParam });
            if (error || !data) {
                throw new Error(error?.message || 'Search function failed to return data.');
            }
            searchResults = data;
          } catch (error) {
            console.error('Error fetching search results:', error);
            searchResults = [];
          }
        } else {
          displayTitle = '';
          searchResults = [];
        }
        
        setSearchTerm(displayTitle);
        setResults(searchResults);
      } catch (error) {
        console.error('Error in search:', error);
        setResults([]);
        setSearchTerm('שגיאה בחיפוש');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.search]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-2">{searchTerm}</h1>
      <p className="text-gray-600 mb-8">
        {loading ? 'מחפש...' : results.length > 0 ? `נמצאו ${results.length} תוצאות` : 'לא נמצאו תוצאות'}
      </p>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">מחפש...</p>
        </div>
      ) : (
        <div>
          {results.length > 0 ? (
            results.map(article => <ArticleCard key={article.id} article={article} />)
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">לא נמצאו תוצאות</h3>
              <p className="text-gray-500 mt-2">נסה לחפש ביטוי אחר.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
