
import { useState, useEffect } from "react";
import { ImageOptimization } from "@/entities/ImageOptimization";
import { Article } from "@/entities/Article";
import { Advertisement } from "@/entities/Advertisement";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    ImageIcon, 
    HardDrive, 
    CheckCircle, 
    XCircle,
    Search,
    RefreshCw,
    Trash2,
    ArrowUpDown,
    Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GenerateImage } from "@/integrations/Core";

export default function ImageOptimizationManager() {
    const [scannedImages, setScannedImages] = useState([]);
    const [stats, setStats] = useState({ total_images: 0, total_size: 0 });
    const [loading, setLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [isDeletingHistory, setIsDeletingHistory] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [sortConfig, setSortConfig] = useState({ key: 'original_size', direction: 'desc' });
    const [optimizingImages, setOptimizingImages] = useState(new Set());

    useEffect(() => {
        loadScannedImages();
    }, []);

    const loadScannedImages = async () => {
        try {
            const data = await ImageOptimization.list('-created_date');
            setScannedImages(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error loading scanned images:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalImages = data.length;
        const totalSize = data.reduce((sum, item) => sum + (item.original_size || 0), 0);
        setStats({ total_images: totalImages, total_size: totalSize });
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const fetchImageSize = async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            if (response.ok && response.headers.has('content-length')) {
                return parseInt(response.headers.get('content-length'), 10);
            }
            const getResponse = await fetch(url);
            if (getResponse.ok) {
                const blob = await getResponse.blob();
                return blob.size;
            }
            return 0;
        } catch (error) {
            console.warn(`Could not fetch size for ${url}:`, error);
            return 0;
        }
    };

    const handleScan = async () => {
        setIsScanning(true);
        setScanProgress(0);
        
        try {
            const [articles, ads] = await Promise.all([
                Article.list(),
                Advertisement.list()
            ]);

            const imageSources = [];
            articles.forEach(a => {
                if (a.featured_image) imageSources.push({ url: a.featured_image, type: 'article', id: a.id });
            });
            ads.forEach(ad => {
                if (ad.image_url) imageSources.push({ url: ad.image_url, type: 'advertisement', id: ad.id });
            });

            const existingUrls = new Set(scannedImages.map(img => img.original_url));
            const imagesToScan = imageSources.filter(src => !existingUrls.has(src.url));

            if (imagesToScan.length === 0) {
                alert("לא נמצאו תמונות חדשות לסריקה.");
                setIsScanning(false);
                return;
            }

            for (let i = 0; i < imagesToScan.length; i++) {
                const source = imagesToScan[i];
                const size = await fetchImageSize(source.url);

                if (size > 0) {
                    await ImageOptimization.create({
                        original_url: source.url,
                        original_size: size,
                        source_type: source.type,
                        source_id: source.id,
                        status: 'analyzed'
                    });
                }
                setScanProgress(Math.round(((i + 1) / imagesToScan.length) * 100));
            }
            
            await loadScannedImages();
            alert(`סריקה הושלמה! נוספו ${imagesToScan.length} תמונות חדשות לניתוח.`);

        } catch (error) {
            console.error('Scan error:', error);
            alert(`שגיאה בסריקה: ${error.message}`);
        } finally {
            setIsScanning(false);
            setScanProgress(0);
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל היסטוריית הסריקה?')) return;
        setIsDeletingHistory(true);
        try {
            const records = await ImageOptimization.list();
            const batchSize = 10;
            for (let i = 0; i < records.length; i += batchSize) {
                const batch = records.slice(i, i + batchSize);
                await Promise.all(batch.map(r => ImageOptimization.delete(r.id)));
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            await loadScannedImages();
            alert('היסטוריית הסריקה נמחקה.');
        } catch (error) {
            console.error('Error clearing history:', error);
            alert('שגיאה במחיקת ההיסטוריה.');
        } finally {
            setIsDeletingHistory(false);
        }
    };

    const optimizeImage = async (imageRecord) => {
        const { id, original_url, source_type, source_id } = imageRecord;

        if (optimizingImages.has(id)) return;
        
        setOptimizingImages(prev => new Set(prev).add(id));
        
        try {
            // 1. Generate the optimized image
            const { url: optimizedUrl } = await GenerateImage({
                prompt: `Create an optimized, compressed version of this image while maintaining quality and visual fidelity: ${original_url}. Focus on reducing file size while preserving important visual details.`
            });
            
            // 2. Fetch both images to get their sizes
            const [originalResponse, optimizedResponse] = await Promise.all([
                fetch(original_url),
                fetch(optimizedUrl)
            ]);
            const [originalBlob, optimizedBlob] = await Promise.all([
                originalResponse.blob(),
                optimizedResponse.blob()
            ]);
            const originalSize = originalBlob.size;
            const optimizedSize = optimizedBlob.size;
            
            // 3. Update the source entity (Article or Advertisement) with the new URL
            if (source_type && source_id) {
                switch (source_type) {
                    case 'article':
                        await Article.update(source_id, { featured_image: optimizedUrl });
                        break;
                    case 'advertisement':
                        await Advertisement.update(source_id, { image_url: optimizedUrl });
                        break;
                    default:
                        console.warn(`Source entity update not implemented for type: ${source_type}`);
                }
            }
            
            // 4. Update the optimization record for tracking purposes
            const compressionRatio = originalSize > 0 ? Math.round(((originalSize - optimizedSize) / originalSize) * 100) : 0;
            await ImageOptimization.update(id, {
                original_url: original_url, // Overwrite original url to ensure it's up to date
                optimized_url: optimizedUrl,
                original_size: originalSize,
                optimized_size: optimizedSize,
                compression_ratio: compressionRatio,
                status: 'optimized',
                format_optimized: 'webp', // Assuming GenerateImage creates webp
                optimization_date: new Date().toISOString()
            });
            
            await loadScannedImages();
            alert(`התמונה הוחלפה ומוטבה בהצלחה! חיסכון של ${compressionRatio}%.`);
            
        } catch (error) {
            console.error('Optimization error:', error);
            
            // Update record with error status
            try {
                await ImageOptimization.update(id, {
                    status: 'failed',
                    error_message: error.message
                });
                await loadScannedImages();
            } catch (updateError) {
                console.error('Failed to update error status:', updateError);
            }
            
            alert(`שגיאה באופטימיזציה: ${error.message}`);
        } finally {
            setOptimizingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    const handleSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedImages = [...scannedImages].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'optimized':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 ml-1" />מאופטימיזציה</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 ml-1" />נכשל</Badge>;
            case 'analyzed':
                return <Badge className="bg-blue-100 text-blue-800">נותח</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">בהמתנה</Badge>;
        }
    };

    const getSourceLink = (image) => {
        if (image.source_type === 'article' && image.source_id) {
            return <Link to={createPageUrl(`Editor?id=${image.source_id}`)} className="text-blue-600 hover:underline">מאמר</Link>;
        }
        if (image.source_type === 'advertisement' && image.source_id) {
            return <span className="text-gray-600">מודעה</span>;
        }
        return <span className="text-gray-500">{image.source_type || 'לא ידוע'}</span>;
    };

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>טוען נתונים...</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4 space-x-reverse">
                <div className="bg-purple-100 p-3 rounded-xl">
                    <ImageIcon className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">דשבורד ניתוח תמונות</h2>
                    <p className="text-gray-600">סרוק וזהה תמונות כבדות באתר לשיפור ביצועים</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">סה"כ תמונות שנסרקו</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_images}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <ImageIcon className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">משקל כולל של התמונות</p>
                                <p className="text-2xl font-bold text-purple-600">{formatBytes(stats.total_size)}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <HardDrive className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>פעולות סריקה</CardTitle>
                    <CardDescription>סרוק את האתר כדי למצוא תמונות חדשות או מחק את ההיסטוריה כדי להתחיל מחדש.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <Button onClick={handleScan} disabled={isScanning || isDeletingHistory} className="flex-1">
                            {isScanning ? <><RefreshCw className="w-4 h-4 ml-2 animate-spin" />סורק... {scanProgress}%</> : <><Search className="w-4 h-4 ml-2" />סרוק תמונות חדשות</>}
                        </Button>
                        <Button variant="destructive" onClick={handleClearHistory} disabled={isDeletingHistory || isScanning} className="flex-1">
                            {isDeletingHistory ? <><RefreshCw className="w-4 h-4 ml-2 animate-spin" />מוחק...</> : <><Trash2 className="w-4 h-4 ml-2" />מחק היסטוריית סריקה</>}
                        </Button>
                    </div>
                    {isScanning && <Progress value={scanProgress} className="w-full" />}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>ניתוח תמונות</CardTitle>
                    <CardDescription>הרשימה מציגה את כל התמונות שנסרקו. מיין לפי גודל כדי למצוא את התמונות הכבדות ביותר.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">תמונה</TableHead>
                                <TableHead>מקור</TableHead>
                                <TableHead 
                                    className="cursor-pointer" 
                                    onClick={() => handleSort('original_size')}
                                >
                                    <div className="flex items-center gap-1">
                                        גודל
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </TableHead>
                                <TableHead>סטטוס</TableHead>
                                <TableHead>פעולות</TableHead>
                                <TableHead>URL</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedImages.length > 0 ? sortedImages.map(img => (
                                <TableRow key={img.id} className={img.original_size > 500000 ? 'bg-red-50' : img.original_size > 200000 ? 'bg-yellow-50' : ''}>
                                    <TableCell>
                                        <a href={img.original_url} target="_blank" rel="noopener noreferrer">
                                            <img src={img.original_url} alt="thumbnail" className="w-16 h-10 object-cover rounded-md border" />
                                        </a>
                                    </TableCell>
                                    <TableCell>{getSourceLink(img)}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="space-y-1">
                                            <div>{formatBytes(img.original_size)}</div>
                                            {img.optimized_size && (
                                                <div className="text-xs text-green-600">
                                                    → {formatBytes(img.optimized_size)}
                                                    {img.compression_ratio && (
                                                        <span className="text-green-700 font-semibold"> (-{img.compression_ratio}%)</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(img.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2 items-start">
                                            {img.status !== 'optimized' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => optimizeImage(img)}
                                                    disabled={optimizingImages.has(img.id)}
                                                    className="h-8 min-w-[120px] justify-center"
                                                >
                                                    {optimizingImages.has(img.id) ? (
                                                        <>
                                                            <RefreshCw className="w-3 h-3 ml-1 animate-spin" />
                                                            אופטימיזציה...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-3 h-3 ml-1" />
                                                            אופטימיזציה
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            {img.optimized_url && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    asChild
                                                    className="h-8 min-w-[120px] justify-center"
                                                >
                                                    <a href={img.optimized_url} target="_blank" rel="noopener noreferrer">
                                                        צפה במאופטימיזציה
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <a href={img.original_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-blue-600 truncate block max-w-xs">
                                            {img.original_url}
                                        </a>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">לא נמצאו תמונות סרוקות. לחץ על "סרוק תמונות חדשות" כדי להתחיל.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
