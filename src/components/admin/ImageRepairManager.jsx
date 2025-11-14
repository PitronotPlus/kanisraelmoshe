
import { useState, useEffect, useRef } from 'react';
import { Article } from '@/entities/Article';
import { repairArticleImages } from '@/functions/repairArticleImages';
import { getRepairableArticles } from '@/functions/getRepairableArticles'; // Import new function
import { UploadFile } from '@/integrations/Core';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, CheckCircle, RefreshCw, Download, Eye, EyeOff, AlertTriangle, Clock, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const isExternalUrl = (url) => {
    if (!url || !url.startsWith('http')) return false;
    const internalHosts = [
        'supabase.co', 
        'base44.app', 
        'qtrypzzcjebvfcihiynt.supabase.co'
    ];
    try {
        const hostname = new URL(url).hostname;
        return !internalHosts.some(host => hostname.endsWith(host) || hostname.includes(host));
    } catch (e) {
        return false;
    }
};

// Helper function to analyze all images in an article
const analyzeArticleImages = (article) => {
    const images = [];
    
    // Check featured image
    if (article.featured_image) {
        images.push({
            url: article.featured_image,
            source: 'תמונה ראשית',
            isExternal: isExternalUrl(article.featured_image)
        });
    }
    
    // Check content images
    const content = article.content || "";
    const imgRegex = /<img[^>]+src="([^"]+)"/g;
    const contentImages = [...content.matchAll(imgRegex)].map(match => match[1]);
    
    contentImages.forEach(url => {
        images.push({
            url: url,
            source: 'תוכן המאמר',
            isExternal: isExternalUrl(url)
        });
    });
    
    const totalImages = images.length;
    const externalImages = images.filter(img => img.isExternal).length;
    const internalImages = images.filter(img => !img.isExternal).length;
    
    return {
        images,
        totalImages,
        externalImages,
        internalImages,
        needsRepair: externalImages > 0
    };
};

// Helper function to convert base64 string to File object
const base64StringToFile = (base64String, filename, contentType) => {
  const byteCharacters = atob(base64String);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  const blob = new Blob(byteArrays, { type: contentType });
  return new File([blob], filename, { type: contentType });
};

const LogEntry = ({ entry }) => {
    const getStatusColor = (type) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-50';
            case 'error': return 'text-red-600 bg-red-50';
            case 'warning': return 'text-yellow-600 bg-yellow-50';
            case 'info': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4" />;
            case 'error': return <AlertTriangle className="w-4 h-4" />;
            case 'warning': return <AlertTriangle className="w-4 h-4" />;
            case 'info': return <Clock className="w-4 h-4" />;
            default: return <Clock className="w-4 h-4" />;
        }
    };

    return (
        <div className={`p-3 rounded-lg border-r-4 ${getStatusColor(entry.type)} mb-2`}>
            <div className="flex items-start space-x-2 space-x-reverse">
                {getIcon(entry.type)}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                            {new Date(entry.timestamp).toLocaleTimeString('he-IL')}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {entry.articleTitle || 'כללי'}
                        </Badge>
                    </div>
                    <p className="text-sm font-medium mt-1">{entry.message}</p>
                    {entry.details && (
                        <p className="text-xs mt-1 opacity-80">{entry.details}</p>
                    )}
                    {entry.url && (
                        <p className="text-xs mt-1 font-mono break-all opacity-60">
                            🔗 {entry.url}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ArticleRow = ({ article, onRepair, isRepairing }) => {
    const imageAnalysis = analyzeArticleImages(article);
    const [showDetails, setShowDetails] = useState(false);

    return (
        <>
            <TableRow>
                <TableCell>
                    <Link to={createPageUrl(`Editor?id=${article.id}`)} className="font-medium text-blue-600 hover:underline">
                        {article.title}
                    </Link>
                </TableCell>
                <TableCell>
                    <div className="space-y-1">
                        <Badge variant={imageAnalysis.externalImages > 0 ? "destructive" : "default"}>
                            {imageAnalysis.externalImages > 0 
                                ? `${imageAnalysis.externalImages}/${imageAnalysis.totalImages} לתקן` 
                                : `${imageAnalysis.totalImages} תקין`
                            }
                        </Badge>
                        <div className="text-xs text-gray-500">
                            פנימיות: {imageAnalysis.internalImages} | חיצוניות: {imageAnalysis.externalImages}
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={() => onRepair(article.id, article.title)}
                            disabled={isRepairing || imageAnalysis.externalImages === 0}
                        >
                            {isRepairing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                    מתקן...
                                </>
                            ) : (
                                <>
                                    <Wrench className="w-4 h-4 ml-2" />
                                    תקן ({imageAnalysis.externalImages})
                                </>
                            )}
                        </Button>
                        {imageAnalysis.totalImages > 0 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowDetails(!showDetails)}
                            >
                                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                        )}
                    </div>
                </TableCell>
            </TableRow>
            {showDetails && imageAnalysis.totalImages > 0 && (
                <TableRow>
                    <TableCell colSpan="3" className="bg-gray-50">
                        <div className="p-4">
                            <h4 className="font-semibold mb-2">תמונות במאמר:</h4>
                            <div className="space-y-2">
                                {imageAnalysis.images.map((image, index) => (
                                    <div key={index} className={`text-sm border-r-2 pr-3 ${
                                        image.isExternal ? 'border-red-300' : 'border-green-300'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={image.isExternal ? "destructive" : "default"} className="text-xs">
                                                {image.isExternal ? 'חיצונית' : 'פנימית'}
                                            </Badge>
                                            <span className="font-medium text-gray-700">{image.source}</span>
                                        </div>
                                        <div className="text-gray-600 break-all font-mono text-xs mt-1">{image.url}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default function ImageRepairManager() {
    const [articlesToRepair, setArticlesToRepair] = useState([]);
    const [loading, setLoading] = useState(true);
    const [repairingIds, setRepairingIds] = useState(new Set());
    const [isBulkRepairing, setIsBulkRepairing] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(0);
    const [bulkMessage, setBulkMessage] = useState("");
    const [log, setLog] = useState([]);
    const [showLog, setShowLog] = useState(true);
    const [stats, setStats] = useState({
        totalProcessed: 0,
        totalSuccess: 0,
        totalFailed: 0,
        imagesRepaired: 0,
        imagesFailed: 0
    });
    
    // New pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const ARTICLES_PER_PAGE = 50;
    
    const logContainerRef = useRef(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [log]);

    const addLogEntry = (type, message, details = null, url = null, articleTitle = null) => {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type,
            message,
            details,
            url,
            articleTitle
        };
        setLog(prev => [entry, ...prev.slice(0, 99)]);
        console.log(`[${type.toUpperCase()}] ${message}`, details);
    };

    const updateStats = (field, increment = 1) => {
        setStats(prev => ({
            ...prev,
            [field]: prev[field] + increment
        }));
    };

    const resetStats = () => {
        setStats({
            totalProcessed: 0,
            totalSuccess: 0,
            totalFailed: 0,
            imagesRepaired: 0,
            imagesFailed: 0
        });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setArticlesToRepair([]); // Clear previous list
            addLogEntry('info', 'מתחיל לסרוק מאמרים עם תמונות חיצוניות הזקוקות לתיקון...');
            
            const response = await getRepairableArticles();
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.error || 'שגיאה בטעינת מאמרים לתיקון מהשרת.');
            }
            
            const articlesNeedingRepair = response.data.data;
            setArticlesToRepair(articlesNeedingRepair);
            
            addLogEntry('success', `נמצאו ${articlesNeedingRepair.length} מאמרים עם תמונות חיצוניות הזקוקות לתיקון.`);
            
        } catch (error) {
            console.error("Failed to fetch data:", error);
            addLogEntry('error', 'שגיאה בטעינת המאמרים', error.message);
        } finally {
            setLoading(false);
        }
    };

    const exportLog = () => {
        const logText = log.map(entry => 
            `[${new Date(entry.timestamp).toLocaleString('he-IL')}] [${entry.type.toUpperCase()}] ${entry.message}${entry.details ? ' - ' + entry.details : ''}${entry.url ? ' - URL: ' + entry.url : ''}`
        ).join('\n');
        
        const blob = new Blob([logText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `image-repair-log-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        addLogEntry('info', 'LOG יוצא לקובץ בהצלחה');
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRepair = async (articleId, articleTitle, isBulk = false) => {
        setRepairingIds(prev => new Set(prev).add(articleId));
        updateStats('totalProcessed');
        addLogEntry('info', `מתחיל תיקון מאמר: ${articleTitle}`, null, null, articleTitle);
        
        try {
            let currentArticle = articlesToRepair.find(art => art.id === articleId);
            if (!currentArticle) {
                addLogEntry('warning', `מאמר ${articleId} לא נמצא ברשימת המאמרים לתיקון. מנסה לשלוף ישירות מבסיס הנתונים.`, null, null, articleTitle);
                try {
                    // Fallback fetch from DB if not found in current state (e.g. already repaired by another action or list is outdated)
                    // Assuming Article.list can take an ID for fetching a specific article
                    const articlesFromDB = await Article.list({ id: articleId }); 
                    currentArticle = articlesFromDB[0];
                    if (!currentArticle) {
                        throw new Error('Article not found in database.');
                    }
                    addLogEntry('info', `מאמר ${articleId} נשלף בהצלחה מבסיס הנתונים.`, null, null, articleTitle);
                } catch (dbError) {
                    throw new Error(`Failed to retrieve article from database: ${dbError.message}`);
                }
            }

            // Analyze images to see what needs repair
            const imageAnalysis = analyzeArticleImages(currentArticle);
            const externalImagesCount = imageAnalysis.externalImages;
            
            if (externalImagesCount === 0) {
                addLogEntry('info', 'אין תמונות חיצוניות לתיקון במאמר זה', null, null, articleTitle);
                updateStats('totalSuccess');
                // Remove from articlesToRepair if it somehow was still there but had no external images
                setArticlesToRepair(prevArticles => prevArticles.filter(art => art.id !== articleId));
                return;
            }

            addLogEntry('info', `נמצאו ${externalImagesCount} תמונות חיצוניות לתיקון`, null, null, articleTitle);

            // Enhanced logging for debugging
            const firstExternalImage = imageAnalysis.images.find(img => img.isExternal);
            if (firstExternalImage) {
                addLogEntry('info', `מנסה לתקן תמונה: ${firstExternalImage.source}`, firstExternalImage.url, null, articleTitle);
                
                // Check if it's an expired OpenAI link
                if (firstExternalImage.url.includes('oaidalleapiprodscus.blob.core.windows.net')) {
                    addLogEntry('warning', 'זוהה קישור OpenAI - בודק אם פג תוקף...', firstExternalImage.url, null, articleTitle);
                }
            }

            addLogEntry('info', 'מוריד תמונה מהשרת החיצוני...', null, null, articleTitle);
            const downloadResponse = await repairArticleImages({ articleId });

            // Enhanced error logging
            if (!downloadResponse.data?.success) {
                const errorMsg = downloadResponse.data?.error || 'Unknown error from repair function';
                addLogEntry('error', `שגיאה בהורדת התמונה: ${errorMsg}`, null, firstExternalImage?.url, articleTitle);
                
                if (downloadResponse.status === 400) {
                    addLogEntry('error', `שגיאה 400 - Bad Request. יכול להיות קישור פג תוקף או בעיה בפרמטרים`, `Status: ${downloadResponse.status}, Error: ${errorMsg}`, firstExternalImage?.url, articleTitle);
                }
                
                if (errorMsg === 'No external images found for repair') {
                    addLogEntry('info', 'אין יותר תמונות חיצוניות לתיקון במאמר זה.', null, null, articleTitle);
                    updateStats('totalSuccess');
                    // Ensure it's removed from the repair list as it's now fully repaired from this perspective
                    setArticlesToRepair(prevArticles => prevArticles.filter(art => art.id !== articleId));
                    return;
                }
                throw new Error(errorMsg);
            }
            
            const { base64, contentType, filename, originalUrl, imageType, totalExternalImages } = downloadResponse.data;
            
            addLogEntry('info', `מעבד תמונה: ${imageType === 'featured_image' ? 'תמונה ראשית' : 'תמונה מהתוכן'}`, null, originalUrl, articleTitle);

            // Step 2: Convert Base64 to a File object
            addLogEntry('info', 'ממיר תמונה לקובץ...', null, null, articleTitle);
            
            let imageFile;
            try {
                imageFile = base64StringToFile(base64, filename, contentType);
                addLogEntry('info', `המרה הושלמה. גודל קובץ: ${imageFile.size} bytes`, null, null, articleTitle);
            } catch (conversionError) {
                throw new Error(`Failed to convert Base64 to file: ${conversionError.message}`);
            }

            // Step 3: Upload the new File using the frontend integration
            addLogEntry('info', 'מעלה תמונה לשרת הפנימי...', null, null, articleTitle);
            const uploadResult = await UploadFile({ file: imageFile });
            
            if (!uploadResult?.file_url) {
                throw new Error('Upload to internal storage failed.');
            }
            
            const newUrl = uploadResult.file_url;
            addLogEntry('success', `העלאה הצליחה. כתובת חדשה: ${newUrl}`, null, originalUrl, articleTitle);

            // Step 4: Update the article's image in the database (featured or content)
            let updateData = {};
            let updatedArticleContent = currentArticle.content;

            if (imageType === 'featured_image') {
                updateData.featured_image = newUrl;
                addLogEntry('info', 'מעדכן תמונה ראשית במאמר בבסיס הנתונים.', null, null, articleTitle);
            } else if (imageType === 'content') {
                // Replace the image URL in content
                const escapedOriginalUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                updatedArticleContent = currentArticle.content.replace(
                    new RegExp(escapedOriginalUrl, 'g'),
                    newUrl
                );
                updateData.content = updatedArticleContent;
                addLogEntry('info', 'מעדכן תמונה בתוכן המאמר בבסיס הנתונים.', null, null, articleTitle);
            } else {
                throw new Error(`Unknown imageType received from backend: ${imageType}`);
            }

            await Article.update(articleId, updateData);
            addLogEntry('success', 'המאמר עודכן בבסיס הנתונים.', null, null, articleTitle);
            
            // Step 5: Update local state immediately
            // Create a hypothetical updated article object to re-analyze its image status
            const locallyUpdatedArticle = { 
                ...currentArticle, 
                ...updateData,
                content: updatedArticleContent // Ensure content is updated for analysis
            };
            const analysisAfterRepair = analyzeArticleImages(locallyUpdatedArticle);

            setArticlesToRepair(prevArticles => {
                if (analysisAfterRepair.needsRepair) {
                    // Article still needs repair, update its content/featured_image locally
                    return prevArticles.map(art => art.id === articleId ? locallyUpdatedArticle : art);
                } else {
                    // Article fully repaired, remove it from the list
                    return prevArticles.filter(art => art.id !== articleId);
                }
            });
            
            addLogEntry('success', 'ממשק המשתמש עודכן.', null, null, articleTitle);

            // Check if there are more external images to repair in this article
            const remainingImages = analysisAfterRepair.externalImages; // Use the analysis after local update
            if (remainingImages > 0) {
                addLogEntry('info', `נותרו עוד ${remainingImages} תמונות חיצוניות במאמר זה.`, 'המאמר עדיין דורש תיקון נוסף. הפעל את הפעולה שוב.', null, articleTitle);
            } else {
                addLogEntry('success', 'כל התמונות החיצוניות במאמר תוקנו בהצלחה!', null, null, articleTitle);
            }

            updateStats('totalSuccess');
            updateStats('imagesRepaired');

            // Add delay after successful repair to prevent server overload
            if (isBulk) {
                addLogEntry('info', 'ממתין 5 שניות לפני המאמר הבא...', null, null, articleTitle);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 3s to 5s
            } else {
                // Even for single repairs, add a small delay to be safe
                addLogEntry('info', 'ממתין 3 שניות...', null, null, articleTitle);
                await new Promise(resolve => setTimeout(resolve, 3000)); // Increased from 1s to 3s
            }
            
        } catch (error) {
            console.error(`Failed to repair article ${articleId}:`, error);
            updateStats('totalFailed');
            const errorMessage = error.message || 'Unknown error during repair';
            
            // Enhanced error logging with more details
            addLogEntry('error', `תיקון מאמר נכשל: ${articleTitle}`, 
                `Error: ${errorMessage}. Response status: ${error.response?.status || 'N/A'}`, 
                null, articleTitle);
            
            // Special handling for 400 errors
            if (error.message.includes('Request failed with status code 400') || (error.response && error.response.status === 400)) {
                addLogEntry('error', 'שגיאה 400 - ייתכן שהקישור פג תוקף או שיש בעיה בפרמטרים שנשלחו לשרת', 
                    'נסה לרענן את הרשימה או לבדוק ידנית את הקישור', null, articleTitle);
            }
            
            if (isBulk) {
                addLogEntry('info', 'ממתין 10 שניות אחרי שגיאה לפני המאמר הבא...', null, null, articleTitle);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Increased from 5s to 10s
            } else {
                addLogEntry('info', 'ממתין 5 שניות אחרי שגיאה...', null, null, articleTitle);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Increased from 2s to 5s
            }
            
            if (!isBulk) {
                alert(`שגיאה בתיקון מאמר "${articleTitle}": ${errorMessage}`);
            }
            throw error;
        } finally {
            setRepairingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(articleId);
                return newSet;
            });
        }
    };
    
    const handleBulkRepair = async () => {
        setIsBulkRepairing(true);
        setBulkProgress(0);
        resetStats();
        
        // Use the current filtered list (important for bulk operations)
        const articlesToProcess = filteredArticlesToRepair;
        const total = articlesToProcess.length;
        
        addLogEntry('info', `מתחיל תיקון קבוצתי של ${total} מאמרים (עם הפסקות בין מאמרים)`);
        setBulkMessage(`מתחיל תיקון קבוצתי של ${total} מאמרים...`);

        for (let i = 0; i < total; i++) {
            // Re-fetch the article from the current state (articlesToRepair)
            // This ensures we're working with the most up-to-date version in the list,
            // in case its properties (like external images count) changed during previous repairs.
            const currentArticleInList = articlesToRepair.find(art => art.id === articlesToProcess[i].id);

            if (!currentArticleInList) {
                addLogEntry('info', `מאמר ${articlesToProcess[i].title} לא נמצא ברשימת התיקונים הנוכחית, מדלג.`, null, null, articlesToProcess[i].title);
                updateStats('totalProcessed');
                updateStats('totalSuccess'); // Consider it "processed successfully" if it's no longer there
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            setBulkMessage(`(${i + 1}/${total}) מתקן את המאמר: ${currentArticleInList.title}`);
            setBulkProgress(((i + 1) / total) * 100);
            
            try {
                // Ensure we only try to repair if the article still has external images
                const analysis = analyzeArticleImages(currentArticleInList);
                if (analysis.needsRepair) {
                    await handleRepair(currentArticleInList.id, currentArticleInList.title, true);
                } else {
                    addLogEntry('info', `מאמר ${currentArticleInList.title} כבר תקין, מדלג.`, null, null, currentArticleInList.title);
                    updateStats('totalProcessed');
                    updateStats('totalSuccess');
                    // Still add a small delay even when skipping
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (e) {
                // Error is already logged inside handleRepair, and delay is already added there
            }
        }

        const finalMessage = `תיקון קבוצתי הושלם! עובדו ${stats.totalProcessed} מאמרים.`;
        setBulkMessage(finalMessage);
        addLogEntry('info', finalMessage);
        
        setIsBulkRepairing(false);
        // Force refresh after bulk repair to ensure list is fully consistent with backend
        await fetchData();
    };

    // Filter and pagination logic
    const filteredArticlesToRepair = articlesToRepair.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredArticlesToRepair.length / ARTICLES_PER_PAGE);
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    const endIndex = startIndex + ARTICLES_PER_PAGE;
    const paginatedArticles = filteredArticlesToRepair.slice(startIndex, endIndex);

    // Reset page when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Force refresh data button for debugging
    const handleRefreshData = async () => {
        addLogEntry('info', 'מרענן נתונים מהשרת...');
        await fetchData();
    };

    if (loading) {
        return <div className="text-center py-10"><RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">תיקון תמונות חיצוניות במאמרים</h3>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={handleRefreshData}
                        size="sm"
                        className="bg-blue-50 hover:bg-blue-100"
                    >
                        <RefreshCw className="w-4 h-4 ml-2" />
                        רענן נתונים
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => setShowLog(!showLog)}
                        size="sm"
                    >
                        {showLog ? <EyeOff className="w-4 h-4 ml-2" /> : <Eye className="w-4 h-4 ml-2" />}
                        {showLog ? 'הסתר LOG' : 'הצג LOG'}
                    </Button>
                    {log.length > 0 && (
                        <Button 
                            variant="outline" 
                            onClick={exportLog}
                            size="sm"
                        >
                            <Download className="w-4 h-4 ml-2" />
                            יצא LOG
                        </Button>
                    )}
                    <Button 
                        onClick={handleBulkRepair} 
                        disabled={isBulkRepairing || filteredArticlesToRepair.length === 0}
                    >
                        <Wrench className="w-4 h-4 ml-2"/>
                        תקן הכל ({filteredArticlesToRepair.length})
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalProcessed}</div>
                        <div className="text-sm text-gray-600">מאמרים עובדו</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.totalSuccess}</div>
                        <div className="text-sm text-gray-600">הצלחות</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.totalFailed}</div>
                        <div className="text-sm text-gray-600">כשלים</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.imagesRepaired}</div>
                        <div className="text-sm text-gray-600">תמונות תוקנו</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{filteredArticlesToRepair.length}</div>
                        <div className="text-sm text-gray-600">נותרו לתיקון</div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar */}
            {isBulkRepairing && (
                <Card>
                    <CardContent className="p-4">
                        <p className="mb-2 font-semibold">{bulkMessage}</p>
                        <Progress value={bulkProgress} className="w-full" />
                        <div className="text-sm text-gray-500 pt-2">
                            <span>הצלחות: {stats.totalSuccess}</span> | 
                            <span> כשלונות: {stats.totalFailed}</span> | 
                            <span> תמונות תוקנו: {stats.imagesRepaired}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Articles List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>מאמרים הזקוקים לתיקון</CardTitle>
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="חיפוש מאמרים..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pr-10"
                                    />
                                </div>
                                <div className="text-sm text-gray-500">
                                    מציג {startIndex + 1}-{Math.min(endIndex, filteredArticlesToRepair.length)} מתוך {filteredArticlesToRepair.length}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>כותרת המאמר</TableHead>
                                        <TableHead>סטטוס תמונות</TableHead>
                                        <TableHead>פעולות</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedArticles.length > 0 ? (
                                        paginatedArticles.map(article => (
                                            <ArticleRow 
                                                key={article.id} 
                                                article={article} 
                                                onRepair={handleRepair} 
                                                isRepairing={repairingIds.has(article.id)}
                                            />
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan="3" className="text-center h-48">
                                                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2"/>
                                                <p className="text-lg">כל הכבוד!</p>
                                                <p className="text-gray-600">
                                                    {searchTerm 
                                                        ? 'לא נמצאו מאמרים העונים על החיפוש'
                                                        : 'לא נמצאו מאמרים עם תמונות חיצוניות הזקוקות לתיקון.'
                                                    }
                                                </p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            
                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 mt-6">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        הקודם
                                    </Button>
                                    
                                    <span className="text-sm mx-4">
                                        עמוד {currentPage} מתוך {totalPages}
                                    </span>
                                    
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                    >
                                        הבא
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Log Panel */}
                {showLog && (
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>יומן פעולות</span>
                                    <Badge variant="outline">{log.length}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    ref={logContainerRef} 
                                    className="h-96 overflow-y-auto space-y-1"
                                >
                                    {log.length > 0 ? (
                                        log.map((entry) => (
                                            <LogEntry key={entry.id} entry={entry} />
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            <p>עדיין לא התחילו פעולות</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
