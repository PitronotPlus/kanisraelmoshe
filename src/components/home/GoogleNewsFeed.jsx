import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { InvokeLLM } from "@/integrations/Core";

export default function GoogleNewsFeed() {
    const [news, setNews] = useState([]);
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

    const fetchNews = async () => {
        setLoading(true);
        try {
            const response = await InvokeLLM({
                prompt: "תן לי 5 חדשות חמות ואקטואליות מישראל מהיום מ-Google News. עבור כל חדשה תן רק כותרת קצרה ומרתקת. אל תכלול קישורים, מקורות או סוגריים. החזר בפורמט JSON נקי.",
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
            
            setNews(cleanedNews);
        } catch (error) {
            console.error('Error loading Google news feed:', error);
            setNews([{ title: "שגיאה בטעינת מבזקי Google News" }]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        const interval = setInterval(fetchNews, 10 * 60 * 1000); // refresh every 10 mins
        return () => clearInterval(interval);
    }, []);
    
    const SkeletonLoader = () => (
        <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
                <li key={i} className="py-3 px-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </li>
            ))}
        </div>
    );

    return (
        <div className="mb-8">
            <div className="sidebar-section-title">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <span>מבזקי Google News</span>
                </div>
                <button onClick={fetchNews} disabled={loading} className="text-white hover:text-orange-300 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <ul className="sidebar-news-list">
                {loading ? <SkeletonLoader /> : (
                    news.map((item, index) => (
                        <li key={index}>
                            <p className="font-semibold leading-tight text-sm text-gray-800">
                                {item.title}
                            </p>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}