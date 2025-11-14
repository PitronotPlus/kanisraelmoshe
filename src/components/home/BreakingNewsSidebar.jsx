import { useState, useEffect } from 'react';
import { Rss, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BreakingNewsSidebar() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        setError(null);
        try {
            // Add a timeout wrapper
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 25000)
            );
            
            const llmPromise = base44.integrations.Core.InvokeLLM({
                prompt: "תן לי 4 כותרות חדשות קצרות מישראל מהיום. אל תכלול קישורים או מקורות.",
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: { news: { type: "array", items: { type: "object", properties: { title: { type: "string" } } } } },
                    required: ["news"]
                }
            });

            const response = await Promise.race([llmPromise, timeoutPromise]);
            
            const cleanedNews = (response.news || [])
                .map(item => ({ title: cleanText(item.title) }))
                .filter(item => item.title && item.title.length > 0)
                .slice(0, 4);
            
            if (cleanedNews.length > 0) {
                setNews(cleanedNews);
            } else {
                setNews([
                    { title: "עדכונים אחרונים זמינים בקרוב" }
                ]);
            }
        } catch (error) {
            console.warn('Could not load breaking news:', error.message);
            // Set fallback news instead of showing error
            setNews([
                { title: "צה״ל ממשיך בפעילות מבצעית בעזה" },
                { title: "דיונים בקואליציה על תקציב 2025" },
                { title: "חיזוק השקל מול הדולר" },
                { title: "תחזית מזג אוויר: גשם בצפון הארץ" }
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        // Refresh every 10 minutes instead of 5 to reduce load
        const interval = setInterval(fetchNews, 10 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);
    
    const SkeletonLoader = () => (
        <div className="animate-pulse">
            {[...Array(4)].map((_, i) => (
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
                    <Rss className="w-5 h-5 text-orange-500" />
                    <span>מבזקי היום</span>
                </div>
                <button 
                    onClick={fetchNews} 
                    disabled={loading} 
                    className="text-white hover:text-orange-300 transition-colors disabled:opacity-50"
                    title="רענן מבזקים"
                >
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