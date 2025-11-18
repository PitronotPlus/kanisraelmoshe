import React, { useState, useEffect } from 'react';
import { Article } from '@/entities/Article';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Video, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

// Function to detect video links in content
const detectVideoLinks = (content) => {
  if (!content) return [];
  
  const videoLinks = [];
  
  // YouTube patterns
  const youtubePatterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/g,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]+)/g,
  ];
  
  // Vimeo pattern
  const vimeoPattern = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/g;
  
  // Check YouTube
  youtubePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      videoLinks.push({
        type: 'youtube',
        id: match[1],
        url: match[0],
        embedCode: `<iframe width="560" height="315" src="https://www.youtube.com/embed/${match[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
      });
    }
  });
  
  // Check Vimeo
  let match;
  while ((match = vimeoPattern.exec(content)) !== null) {
    videoLinks.push({
      type: 'vimeo',
      id: match[1],
      url: match[0],
      embedCode: `<iframe src="https://player.vimeo.com/video/${match[1]}" width="640" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
    });
  }
  
  return videoLinks;
};

// Function to check if link is already properly embedded
const isProperlyEmbedded = (content, videoLink) => {
  return content.includes(videoLink.embedCode) || 
         content.includes(`youtube.com/embed/${videoLink.id}`) ||
         content.includes(`player.vimeo.com/video/${videoLink.id}`);
};

// Function to fix video embeds in content
const fixVideoEmbeds = (content, videoLinks) => {
  let fixedContent = content;
  
  videoLinks.forEach(link => {
    if (!isProperlyEmbedded(content, link)) {
      // Replace plain link with embed code
      fixedContent = fixedContent.replace(link.url, link.embedCode);
    }
  });
  
  return fixedContent;
};

export default function VideoEmbedFixer() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({ total: 0, needsFix: 0, fixed: 0 });

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const allArticles = await Article.filter({ published: true }, '-created_date', 200);
      
      // Analyze articles for video links
      const analyzed = allArticles.map(article => {
        const videoLinks = detectVideoLinks(article.content);
        const needsEmbedFix = videoLinks.some(link => !isProperlyEmbedded(article.content, link));
        const needsFormatFix = videoLinks.length > 0 && article.media_type !== 'video';
        
        return {
          ...article,
          videoLinks,
          needsEmbedFix,
          needsFormatFix,
          needsFix: needsEmbedFix || needsFormatFix,
          hasVideo: videoLinks.length > 0
        };
      });
      
      // Filter only articles with videos
      const withVideos = analyzed.filter(a => a.hasVideo);
      
      setArticles(withVideos);
      setStats({
        total: withVideos.length,
        needsFix: withVideos.filter(a => a.needsFix).length,
        fixed: 0
      });
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixSingleArticle = async (article) => {
    setProcessing(true);
    try {
      const updateData = {};
      
      if (article.needsEmbedFix) {
        updateData.content = fixVideoEmbeds(article.content, article.videoLinks);
      }
      
      if (article.needsFormatFix) {
        updateData.media_type = 'video';
        // Set featured_video_url if not already set
        if (!article.featured_video_url && article.videoLinks.length > 0) {
          updateData.featured_video_url = article.videoLinks[0].url;
        }
      }
      
      await Article.update(article.id, updateData);
      
      // Reload articles
      await loadArticles();
      setStats(prev => ({ ...prev, fixed: prev.fixed + 1 }));
    } catch (error) {
      console.error('Error fixing article:', error);
      alert('שגיאה בתיקון המאמר');
    } finally {
      setProcessing(false);
    }
  };

  const fixAllArticles = async () => {
    if (!confirm(`האם אתה בטוח שברצונך לתקן ${stats.needsFix} מאמרים?`)) return;
    
    setProcessing(true);
    let fixed = 0;
    
    try {
      const articlesToFix = articles.filter(a => a.needsFix);
      
      for (const article of articlesToFix) {
        const updateData = {};
        
        if (article.needsEmbedFix) {
          updateData.content = fixVideoEmbeds(article.content, article.videoLinks);
        }
        
        if (article.needsFormatFix) {
          updateData.media_type = 'video';
          if (!article.featured_video_url && article.videoLinks.length > 0) {
            updateData.featured_video_url = article.videoLinks[0].url;
          }
        }
        
        await Article.update(article.id, updateData);
        fixed++;
      }
      
      alert(`תוקנו ${fixed} מאמרים בהצלחה!`);
      await loadArticles();
    } catch (error) {
      console.error('Error fixing articles:', error);
      alert('שגיאה בתיקון המאמרים');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>טוען מאמרים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">מתקן הטמעת וידאו</h2>
        <p className="text-gray-600">זיהוי ותיקון אוטומטי של קישורי וידאו במאמרים</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">מאמרים עם וידאו</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Video className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">דורשים תיקון</p>
                <p className="text-3xl font-bold text-orange-600">{stats.needsFix}</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">תוקנו בהפעלה זו</p>
                <p className="text-3xl font-bold text-green-600">{stats.fixed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {stats.needsFix > 0 && (
        <div className="flex space-x-4 space-x-reverse">
          <Button 
            onClick={fixAllArticles} 
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            {processing ? 'מתקן...' : `תקן את כל ${stats.needsFix} המאמרים`}
          </Button>
          <Button 
            onClick={loadArticles} 
            variant="outline"
            disabled={processing}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן
          </Button>
        </div>
      )}

      {/* Articles List */}
      <div className="space-y-4">
        {articles.map(article => (
          <Card key={article.id} className={article.needsFix ? 'border-orange-300' : 'border-green-300'}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{article.title}</CardTitle>
                  <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-2">
                    {article.needsFix ? (
                      <Badge variant="destructive">דורש תיקון</Badge>
                    ) : (
                      <Badge className="bg-green-600">תקין</Badge>
                    )}
                    {article.needsEmbedFix && (
                      <Badge className="bg-orange-600">הטמעה לא תקינה</Badge>
                    )}
                    {article.needsFormatFix && (
                      <Badge className="bg-purple-600">פורמט שגוי</Badge>
                    )}
                    <Badge variant="outline">{article.videoLinks.length} סרטונים</Badge>
                    {article.media_type !== 'video' && (
                      <Badge variant="outline" className="text-gray-600">
                        פורמט נוכחי: {article.media_type === 'image' ? 'תמונה' : article.media_type === 'audio' ? 'אודיו' : 'אחר'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <Link to={createPageUrl(`Article?id=${article.id}`)} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  {article.needsFix && (
                    <Button 
                      onClick={() => fixSingleArticle(article)}
                      disabled={processing}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      תקן
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-semibold">קישורי וידאו שנמצאו:</p>
                {article.videoLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center space-x-2 space-x-reverse bg-gray-50 p-2 rounded text-sm">
                    {link.type === 'youtube' ? (
                      <Youtube className="w-4 h-4 text-red-600" />
                    ) : (
                      <Video className="w-4 h-4 text-blue-600" />
                    )}
                    <span className="flex-1 truncate">{link.url}</span>
                    {isProperlyEmbedded(article.content, link) ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">לא נמצאו מאמרים עם קישורי וידאו</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}