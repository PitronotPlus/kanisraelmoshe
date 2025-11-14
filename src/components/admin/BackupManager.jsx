import React, { useState, useEffect } from 'react';
import { Article } from '@/entities/Article';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Download, FileText, HardDrive, Archive, RefreshCw, Database, Video, Copy, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

// Helper function to determine if a URL is external based on a list of internal hostnames
const isExternalUrl = (url) => {
    if (!url || !url.startsWith('http')) return false;
    const internalHosts = [
        'supabase.co', 
        'base44.app', 
        'qtrypzzcjebvfcihiynt.supabase.co'
    ];
    try {
        const hostname = new URL(url).hostname;
        return !internalHosts.some(host => hostname.includes(host));
    } catch (e) {
        return false;
    }
};

export default function BackupManager() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportProgress, setExportProgress] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [imageUrls, setImageUrls] = useState([]);
    const [uploadedVideos, setUploadedVideos] = useState([]);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(null);
    const [stats, setStats] = useState({
        totalArticles: 0,
        totalImages: 0,
        totalSize: 0,
        publishedArticles: 0
    });

    useEffect(() => {
        loadData();
        loadUploadedVideos();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const articleData = await Article.list('-created_date');
            setArticles(articleData);
            
            // Extract all image URLs and calculate stats
            const images = new Set();
            let publishedCount = 0;
            
            articleData.forEach(article => {
                if (article.published) publishedCount++;
                
                if (article.featured_image) {
                    images.add(article.featured_image);
                }
                
                // Extract images from content
                const content = article.content || "";
                const imgRegex = /<img[^>]+src="([^"]+)"/g;
                const contentImages = [...content.matchAll(imgRegex)].map(match => match[1]);
                contentImages.forEach(url => images.add(url));
            });
            
            const imageUrlArray = Array.from(images);
            setImageUrls(imageUrlArray);
            
            setStats({
                totalArticles: articleData.length,
                totalImages: imageUrlArray.length,
                publishedArticles: publishedCount,
                totalSize: 0
            });
            
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUploadedVideos = () => {
        const saved = localStorage.getItem('uploaded_videos');
        if (saved) {
            try {
                setUploadedVideos(JSON.parse(saved));
            } catch (e) {
                setUploadedVideos([]);
            }
        }
    };

    const handleVideoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if it's a video file
        if (!file.type.startsWith('video/')) {
            alert('אנא בחר קובץ וידאו בלבד');
            return;
        }

        setIsUploadingVideo(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            const newVideo = {
                id: Date.now().toString(),
                name: file.name,
                url: file_url,
                uploadDate: new Date().toISOString(),
                size: file.size,
                type: file.type
            };
            
            const updatedVideos = [newVideo, ...uploadedVideos];
            setUploadedVideos(updatedVideos);
            localStorage.setItem('uploaded_videos', JSON.stringify(updatedVideos));
            
            alert('הוידאו הועלה בהצלחה!');
        } catch (error) {
            console.error('Error uploading video:', error);
            alert('שגיאה בהעלאת הוידאו');
        } finally {
            setIsUploadingVideo(false);
        }
    };

    const copyToClipboard = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 2000);
    };

    const deleteVideo = (videoId) => {
        if (confirm('האם אתה בטוח שברצונך למחוק את הוידאו מהרשימה?')) {
            const updatedVideos = uploadedVideos.filter(v => v.id !== videoId);
            setUploadedVideos(updatedVideos);
            localStorage.setItem('uploaded_videos', JSON.stringify(updatedVideos));
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const exportArticles = async (format = 'json') => {
        setIsExporting(true);
        setExportProgress(0);
        
        try {
            const total = articles.length;
            let exportData = [];
            
            for (let i = 0; i < total; i++) {
                const article = articles[i];
                
                if (format === 'json') {
                    exportData.push({
                        id: article.id,
                        title: article.title,
                        slug: article.slug,
                        content: article.content,
                        excerpt: article.excerpt,
                        category: article.category,
                        subcategory: article.subcategory,
                        featured_image: article.featured_image,
                        tags: article.tags,
                        published: article.published,
                        author: article.author,
                        created_date: article.created_date,
                        updated_date: article.updated_date,
                        views: article.views || 0
                    });
                } else if (format === 'csv') {
                    exportData.push({
                        ID: article.id,
                        Title: article.title,
                        Category: article.category,
                        Published: article.published ? 'Yes' : 'No',
                        Author: article.author || '',
                        'Created Date': format(new Date(article.created_date), 'dd/MM/yyyy', { locale: he }),
                        Views: article.views || 0,
                        'Featured Image': article.featured_image || '',
                        Tags: Array.isArray(article.tags) ? article.tags.join(', ') : ''
                    });
                }
                
                setExportProgress(Math.round(((i + 1) / total) * 100));
            }
            
            let fileContent, fileName, mimeType;
            
            if (format === 'json') {
                fileContent = JSON.stringify(exportData, null, 2);
                fileName = `articles-backup-${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
            } else if (format === 'csv') {
                const headers = Object.keys(exportData[0]).join(',');
                const rows = exportData.map(item => 
                    Object.values(item).map(value => 
                        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
                    ).join(',')
                );
                fileContent = [headers, ...rows].join('\n');
                fileName = `articles-export-${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
            }
            
            const blob = new Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('שגיאה בייצוא הנתונים');
        } finally {
            setIsExporting(false);
            setExportProgress(0);
        }
    };

    const exportImagesList = () => {
        const imageData = imageUrls.map((url, index) => ({
            index: index + 1,
            url: url,
            type: isExternalUrl(url) ? 'External' : 'Internal',
            domain: new URL(url).hostname
        }));
        
        const headers = ['Index', 'URL', 'Type', 'Domain'];
        const rows = imageData.map(item => 
            Object.values(item).map(value => 
                typeof value === 'string' && value.includes(',') ? `"${value}"` : value
            ).join(',')
        );
        const csvContent = [headers.join(','), ...rows].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `images-list-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                <div className="bg-orange-100 p-3 rounded-xl">
                    <Archive className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">גיבוי וניהול קבצים</h2>
                    <p className="text-gray-600">ייצא מאמרים ונהל קבצי מדיה באתר</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">סך מאמרים</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                            </div>
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">מאמרים פורסמו</p>
                                <p className="text-2xl font-bold text-green-600">{stats.publishedArticles}</p>
                            </div>
                            <div className="bg-green-100 p-3 rounded-xl">
                                <Database className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">סך קבצי תמונות</p>
                                <p className="text-2xl font-bold text-purple-600">{stats.totalImages}</p>
                            </div>
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <HardDrive className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">קבצי וידאו</p>
                                <p className="text-2xl font-bold text-red-600">{uploadedVideos.length}</p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-xl">
                                <Video className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Video Upload Section - NEW */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        העלאת וידאו
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">העלה קבצי וידאו לשימוש בבאנרים ובמקומות אחרים באתר</p>
                    
                    <div className="flex gap-4 items-center">
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                            id="video-upload"
                            disabled={isUploadingVideo}
                        />
                        <Button
                            onClick={() => document.getElementById('video-upload')?.click()}
                            disabled={isUploadingVideo}
                            className="flex-1"
                        >
                            {isUploadingVideo ? (
                                <>
                                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                    מעלה וידאו...
                                </>
                            ) : (
                                <>
                                    <Video className="w-4 h-4 ml-2" />
                                    בחר קובץ וידאו להעלאה
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Uploaded Videos List */}
                    {uploadedVideos.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="font-semibold">וידאו שהועלו ({uploadedVideos.length}):</h4>
                            <div className="space-y-2">
                                {uploadedVideos.map((video) => (
                                    <div key={video.id} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Video className="w-4 h-4 text-gray-500" />
                                                    <span className="font-medium">{video.name}</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    <span>גודל: {formatFileSize(video.size)}</span>
                                                    <span className="mx-2">•</span>
                                                    <span>הועלה: {format(new Date(video.uploadDate), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <Input
                                                        value={video.url}
                                                        readOnly
                                                        className="text-sm font-mono"
                                                        dir="ltr"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(video.url)}
                                                    >
                                                        {copiedUrl === video.url ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                                                    <strong>שימוש בוידאו:</strong> העתק את הקישור למעלה והשתמש בו ב-HTML: 
                                                    <code className="block mt-1 text-xs">{`<video src="${video.url}" controls></video>`}</code>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => deleteVideo(video.id)}
                                            >
                                                מחק
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Export Articles Section */}
            <Card>
                <CardHeader>
                    <CardTitle>ייצוא מאמרים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">ייצא את כל המאמרים באתר לקובץ לגיבוי או העברה.</p>
                    
                    {isExporting && (
                        <div className="space-y-2">
                            <Progress value={exportProgress} className="w-full" />
                            <p className="text-sm text-gray-600">מייצא... {exportProgress}%</p>
                        </div>
                    )}
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <Button 
                            onClick={() => exportArticles('json')}
                            disabled={isExporting}
                            className="flex-1"
                        >
                            {isExporting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                                    מייצא...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 ml-2" />
                                    ייצא כ-JSON (גיבוי מלא)
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => exportArticles('csv')}
                            disabled={isExporting}
                            className="flex-1"
                        >
                            <Download className="w-4 h-4 ml-2" />
                            ייצא כ-CSV (סיכום)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Images Management Section */}
            <Card>
                <CardHeader>
                    <CardTitle>ניהול קבצי תמונות</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-600">רשימת כל התמונות המשמשות באתר ואפשרויות ניהול.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{imageUrls.length}</p>
                            <p className="text-sm text-gray-600">סך תמונות</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">
                                {imageUrls.filter(url => !isExternalUrl(url)).length}
                            </p>
                            <p className="text-sm text-gray-600">תמונות פנימיות</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-2xl font-bold text-red-600">
                                {imageUrls.filter(url => isExternalUrl(url)).length}
                            </p>
                            <p className="text-sm text-gray-600">תמונות חיצוניות</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">
                                {new Set(imageUrls.map(url => {
                                    try { return new URL(url).hostname; } 
                                    catch { return 'invalid'; }
                                })).size}
                            </p>
                            <p className="text-sm text-gray-600">דומיינים שונים</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <Button onClick={exportImagesList} variant="outline" className="flex-1">
                            <Download className="w-4 h-4 ml-2" />
                            ייצא רשימת תמונות
                        </Button>
                        <Button onClick={loadData} variant="outline">
                            <RefreshCw className="w-4 h-4 ml-2" />
                            רענן נתונים
                        </Button>
                    </div>
                    
                    {/* Sample Images Preview */}
                    <div className="mt-6">
                        <h4 className="font-semibold mb-3">דוגמת תמונות באתר (10 הראשונות):</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {imageUrls.slice(0, 10).map((url, index) => (
                                <div key={index} className="space-y-2">
                                    <img 
                                        src={url} 
                                        alt={`תמונה ${index + 1}`}
                                        className="w-full h-20 object-cover rounded border"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                    <Badge variant={isExternalUrl(url) ? 'destructive' : 'default'} className="text-xs">
                                        {isExternalUrl(url) ? 'חיצוני' : 'פנימי'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}