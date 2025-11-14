import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Article } from '@/entities/Article';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Archive, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ArchiveWidget({ displayType }) {
  const [archiveLinks, setArchiveLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndProcessArchives = async () => {
      try {
        setLoading(true);
        const allArticles = await Article.list('-created_date');

        if (!allArticles || allArticles.length === 0) {
          setArchiveLinks([]);
          return;
        }
        
        // Use a Set to store unique months (YYYY-MM format)
        const months = new Set();
        allArticles.forEach(article => {
          const date = new Date(article.original_publication_date || article.created_date);
          months.add(format(date, 'yyyy-MM'));
        });

        // Convert Set to array and sort descending
        const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
        
        setArchiveLinks(sortedMonths);

      } catch (error) {
        console.error("Failed to process archive data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessArchives();
  }, []);

  const handleArchiveChange = (value) => {
    if (value) {
        const [year, month] = value.split('-');
        navigate(createPageUrl(`Archive?year=${year}&month=${month}`));
    }
  };

  return (
    <div className="mb-8">
      <div className="sidebar-section-title">
        <span>ארכיון</span>
        <Archive className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white border border-gray-200 border-t-0 p-4">
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : archiveLinks.length > 0 ? (
           <Select onValueChange={handleArchiveChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="בחר חודש מהארכיון" />
            </SelectTrigger>
            <SelectContent>
              {archiveLinks.map(link => {
                const [year, month] = link.split('-');
                // Create a date object to format the month name correctly
                const dateObj = new Date(parseInt(year), parseInt(month) - 1);
                return (
                  <SelectItem key={link} value={link}>
                    {format(dateObj, 'LLLL yyyy', { locale: he })}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-sm text-gray-500">לא נמצאו פריטים בארכיון.</p>
        )}
      </div>
    </div>
  );
}