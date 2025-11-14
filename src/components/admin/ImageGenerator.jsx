
import { useState, useEffect } from 'react';
import { Article } from '@/entities/Article';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ImageIcon, RefreshCw, Wand2, CheckCircle, ExternalLink, Search } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { openaiImage } from '@/functions/openaiImage';
import { downloadImageFromUrl } from '@/functions/downloadImageFromUrl';
import { UploadFile } from '@/integrations/Core';

const isImageBrokenOrMissing = (imageUrl) => {
  if (!imageUrl) return true;
  if (imageUrl === 'NULL' || imageUrl === 'null') return true;
  if (imageUrl.includes('/wp-content/uploads/archives/NULL')) return true;
  if (imageUrl.includes('NULL')) return true;
  return false;
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

const ArticleRow = ({ article, onToggleSelect, isSelected, isGenerating, currentlyProcessing }) => {
  const isBeingProcessed = isGenerating && currentlyProcessing === article.title;
  return (
    <TableRow>
      <TableCell>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={(checked) => onToggleSelect(article.id, checked)}
          disabled={isGenerating}
        />
      </TableCell>
      <TableCell className="max-w-xs">
        <div className="truncate font-medium">{article.title}</div>
        <div className="text-sm text-gray-500">{article.category}</div>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {format(new Date(article.original_publication_date || article.created_date), 'dd/MM/yyyy', { locale: he })}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {isImageBrokenOrMissing(article.featured_image) ? (
            <Badge variant="destructive">אין תמונה</Badge>
          ) : (
            <Badge variant="default">יש תמונה</Badge>
          )}
        </div>
        {article.featured_image && (
          <div className="text-xs text-gray-400 truncate max-w-32" title={article.featured_image}>
            {article.featured_image}
          </div>
        )}
      </TableCell>
      <TableCell>
        {isBeingProcessed ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm">מעבד...</span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">ממתין</span>
        )}
      </TableCell>
    </TableRow>
  );
};

const GeneratedImageCard = ({ article }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {!imageLoaded && !imageError && (
          <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400">טוען תמונה...</div>
          </div>
        )}
        {imageError && (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-gray-400">שגיאה בטעינת תמונה</div>
          </div>
        )}
        <img 
          src={article.featured_image} 
          alt={article.title}
          className={`w-full h-48 object-cover transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          onLoad={() => {setImageLoaded(true); setImageError(false);}}
          onError={() => {setImageError(true); setImageLoaded(false);}}
          style={{ display: imageError ? 'none' : (imageLoaded ? 'block' : 'none') }}
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open(article.featured_image, '_blank')}
            className="bg-white/90 hover:bg-white"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm line-clamp-2 mb-2">{article.title}</h3>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{article.category}</span>
          <span>{format(new Date(article.original_publication_date || article.created_date), 'dd/MM/yyyy', { locale: he })}</span>
        </div>
        {article.author && (
          <div className="text-xs text-gray-400 mt-1">מאת: {article.author}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default function ImageGenerator() {
  const [articles, setArticles] = useState([]);
  const [articlesWithoutImages, setArticlesWithoutImages] = useState([]);
  const [articlesWithImages, setArticlesWithImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticles, setSelectedArticles] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentlyProcessing, setCurrentlyProcessing] = useState('');
  const [activeTab, setActiveTab] = useState('without-images');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const ARTICLES_PER_PAGE = 50;

  // New state for system-wide selection
  const [selectAllSystemWide, setSelectAllSystemWide] = useState(false);
  
  const [stats, setStats] = useState({
    total: 0,
    withImages: 0,
    withoutImages: 0,
    processed: 0,
    successful: 0,
    failed: 0
  });

  // Pagination states for generated images
  const [generatedImagesPage, setGeneratedImagesPage] = useState(1);
  const IMAGES_PER_PAGE = 12;

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const allArticles = await Article.list('-created_date');
      
      const withoutImages = allArticles.filter(article => 
        isImageBrokenOrMissing(article.featured_image)
      );
      
      const withImages = allArticles.filter(article => 
        !isImageBrokenOrMissing(article.featured_image)
      ).sort((a, b) => new Date(b.created_date || b.original_publication_date).getTime() - new Date(a.created_date || a.original_publication_date).getTime());
      
      setArticles(allArticles);
      setArticlesWithoutImages(withoutImages);
      setArticlesWithImages(withImages);
      setStats({
        total: allArticles.length,
        withImages: withImages.length,
        withoutImages: withoutImages.length,
        processed: 0,
        successful: 0,
        failed: 0
      });
    } catch (error) {
      console.error('שגיאה בטעינת המאמרים:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter articles based on search term
  const filteredArticlesWithoutImages = articlesWithoutImages.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations for articles without images
  const totalPages = Math.ceil(filteredArticlesWithoutImages.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const paginatedArticles = filteredArticlesWithoutImages.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleToggleSelect = (articleId, checked) => {
    setSelectAllSystemWide(false); // Any individual selection disables system-wide mode
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(articleId);
      } else {
        newSet.delete(articleId);
      }
      return newSet;
    });
  };

  const handleSelectPage = (checked) => {
    setSelectAllSystemWide(false);
    const newSet = new Set(selectedArticles);
    if (checked) {
      paginatedArticles.forEach(a => newSet.add(a.id));
    } else {
      paginatedArticles.forEach(a => newSet.delete(a.id));
    }
    setSelectedArticles(newSet);
  };

  const handleSelectAllSystemWide = () => {
      setSelectAllSystemWide(true);
      setSelectedArticles(new Set(filteredArticlesWithoutImages.map(a => a.id)));
  };

  const handleClearSelection = () => {
      setSelectedArticles(new Set());
      setSelectAllSystemWide(false);
  };

  const generateImageForArticle = async (article) => {
    try {
      console.log('Generating image for:', article.title);
      
      // Step 1: Generate image with OpenAI and get temporary URL
      const openaiResponse = await openaiImage({
        title: article.title,
      });
      
      if (!openaiResponse.data?.success || !openaiResponse.data?.imageUrl) {
        throw new Error(openaiResponse.data?.message || 'לא התקבלה תמונה מ-OpenAI');
      }
      const tempUrl = openaiResponse.data.imageUrl;
      console.log('Got temporary URL:', tempUrl);

      // Step 2: Download the image from the temporary URL via backend function
      console.log('Downloading image from temp URL...');
      const downloadResponse = await downloadImageFromUrl({ imageUrl: tempUrl });
      
      if (!downloadResponse.data?.success) {
          throw new Error(downloadResponse.data?.error || 'Failed to download image data from backend.');
      }
      const { base64, contentType, filename } = downloadResponse.data;
      console.log('Image downloaded successfully as Base64');

      // Step 3: Convert Base64 to a File object
      console.log('Converting Base64 to file...');
      const imageFile = base64StringToFile(base64, filename, contentType);

      // Step 4: Upload the File object to our permanent storage
      console.log('Uploading file to permanent storage...');
      const uploadResult = await UploadFile({ file: imageFile });

      if (!uploadResult?.file_url) {
        throw new Error('Upload to internal storage failed.');
      }
      const permanentUrl = uploadResult.file_url;
      console.log('Got permanent URL:', permanentUrl);

      return permanentUrl;

    } catch (error) {
      console.error(`שגיאה ביצירת תמונה עבור מאמר ${article.id}:`, error);
      
      // Provide meaningful error messages based on the error type
      if (error.message.includes('safety system')) {
        throw new Error(`הכותרת "${article.title}" מכילה תוכן שלא מותר על-ידי מערכת הבטיחות של OpenAI. מאמר זה יידלג.`);
      } else if (error.message.includes('OpenAi_API_KEY')) {
        throw new Error('מפתח OpenAI API לא מוגדר בהגדרות המערכת');
      } else if (error.message.includes('billing')) {
        throw new Error('בעיה בחיוב OpenAI - אנא בדוק את חשבון ה-API');
      } else if (error.message.includes('rate limit')) {
        throw new Error('הגעת למגבלת הקצב של OpenAI - המתן מעט ונסה שוב');
      } else {
        throw new Error(`שגיאה בתהליך יצירת התמונה: ${error.message}`);
      }
    }
  };

  const handleGenerateImages = async () => {
    if (selectedArticles.size === 0 && !selectAllSystemWide) {
      alert('אנא בחר לפחות מאמר אחד לעיבוד');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    let successCount = 0;
    
    // Use the full filtered list if "Select All" is checked, otherwise use the selected set
    const articlesToProcess = selectAllSystemWide 
      ? filteredArticlesWithoutImages 
      : articlesWithoutImages.filter(a => selectedArticles.has(a.id));
      
    const total = articlesToProcess.length;

    setStats(prev => ({ ...prev, processed: 0, successful: 0, failed: 0 }));
    
    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i];
      setCurrentlyProcessing(article.title);
      
      try {
        const imageUrl = await generateImageForArticle(article);
        await Article.update(article.id, { featured_image: imageUrl });
        
        const updatedArticle = { ...article, featured_image: imageUrl };
        setArticlesWithoutImages(prev => prev.filter(a => a.id !== article.id));
        setArticlesWithImages(prev => [updatedArticle, ...prev]);
        
        successCount++;
        setStats(prev => ({
          ...prev, // Correctly carry over previous stats
          processed: prev.processed + 1,
          successful: prev.successful + 1,
          withImages: prev.withImages + 1,
          withoutImages: prev.withoutImages - 1,
        }));
      } catch (error) {
        console.error(`נכשל ביצירת תמונה עבור: ${article.title}`, error);
        setStats(prev => ({ ...prev, processed: prev.processed + 1, failed: prev.failed + 1 }));
      }
      setGenerationProgress(((i + 1) / total) * 100);
    }
    
    setIsGenerating(false);
    setCurrentlyProcessing('');
    handleClearSelection(); // Clear selection after completion
    
    setActiveTab('generated-images');
    
    alert(`הושלם! ${successCount} תמונות נוצרו והועלו בהצלחה.`);
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4" />
        <p>טוען מאמרים...</p>
      </div>
    );
  }

  const isAllOnPageSelected = paginatedArticles.length > 0 && paginatedArticles.every(a => selectedArticles.has(a.id));
  const isIndeterminate = !selectAllSystemWide && paginatedArticles.some(a => selectedArticles.has(a.id)) && !isAllOnPageSelected;

  // Pagination calculations for generated images
  const totalGeneratedPages = Math.ceil(articlesWithImages.length / IMAGES_PER_PAGE);
  const generatedImagesStartIndex = (generatedImagesPage - 1) * IMAGES_PER_PAGE;
  const generatedImagesEndIndex = generatedImagesStartIndex + IMAGES_PER_PAGE;
  const paginatedGeneratedImages = articlesWithImages.slice(generatedImagesStartIndex, generatedImagesEndIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Wand2 className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">מחולל תמונות AI מתקדם</h2>
            <p className="text-gray-600">יוצר תמונות מותאמות למאמרים בעברית באמצעות בינה מלאכותית</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={loadArticles}
            disabled={isGenerating}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">סה״כ מאמרים</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.withImages}</div>
            <div className="text-sm text-gray-600">עם תמונות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.withoutImages}</div>
            <div className="text-sm text-gray-600">ללא תמונות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.processed}</div>
            <div className="text-sm text-gray-600">עובדו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successful}</div>
            <div className="text-sm text-gray-600">הצליחו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-600">נכשלו</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {isGenerating && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">מחפש תמונות...</span>
              <span className="text-sm text-gray-500">{Math.round(generationProgress)}%</span>
            </div>
            <Progress value={generationProgress} className="w-full mb-2" />
            {currentlyProcessing && (
              <p className="text-sm text-gray-600">עכשיו: {currentlyProcessing}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      {selectedArticles.size > 0 && (
        <Card className="bg-blue-50 border-blue-200 sticky top-4 z-10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                {selectAllSystemWide ? (
                    <div className="font-bold text-blue-800">
                        כל {selectedArticles.size} המאמרים במסנן נבחרו. 
                        <Button variant="link" className="p-1 h-auto text-blue-700" onClick={handleClearSelection}>נקה בחירה</Button>
                    </div>
                ) : isAllOnPageSelected && filteredArticlesWithoutImages.length > paginatedArticles.length ? (
                    <div className="font-bold">
                        כל {paginatedArticles.length} המאמרים בעמוד זה נבחרו.
                        <Button variant="link" className="p-1 h-auto text-blue-700" onClick={handleSelectAllSystemWide}>
                          בחר את כל {filteredArticlesWithoutImages.length} המאמרים
                        </Button>
                    </div>
                ) : (
                    <div className="font-bold">{selectedArticles.size} מאמרים נבחרו</div>
                )}
              </div>

              <Button 
                onClick={handleGenerateImages}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Wand2 className="w-4 h-4 ml-2" />
                צור והעלה תמונות ({selectedArticles.size})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="without-images">ללא תמונות ({stats.withoutImages})</TabsTrigger>
          <TabsTrigger value="generated-images">תמונות שנוצרו ({stats.withImages})</TabsTrigger>
          <TabsTrigger value="statistics">סטטיסטיקות</TabsTrigger>
        </TabsList>

        <TabsContent value="without-images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מאמרים הזקוקים לתמונות</CardTitle>
              <CardDescription>
                מציג {paginatedArticles.length} מתוך {filteredArticlesWithoutImages.length} מאמרים
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="חיפוש לפי כותרת או קטגוריה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                {searchTerm && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    נקה
                  </Button>
                )}
              </div>

              {/* Pagination Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">
                  מציג {startIndex + 1}-{Math.min(endIndex, filteredArticlesWithoutImages.length)} מתוך {filteredArticlesWithoutImages.length} מאמרים
                </div>
                <div className="text-sm text-gray-600">
                  עמוד {currentPage} מתוך {totalPages}
                </div>
              </div>

              {paginatedArticles.length === 0 ? (
                <div className="text-center py-8">
                  {searchTerm ? (
                    <>
                      <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium">לא נמצאו תוצאות</p>
                      <p className="text-gray-600">נסה מונחי חיפוש אחרים</p>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium">מעולה!</p>
                      <p className="text-gray-600">כל המאמרים כבר כוללים תמונות.</p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={isAllOnPageSelected || selectAllSystemWide}
                            indeterminate={isIndeterminate}
                            onCheckedChange={(checked) => {
                                if(selectAllSystemWide) handleClearSelection();
                                else handleSelectPage(checked);
                            }}
                            disabled={isGenerating}
                          />
                        </TableHead>
                        <TableHead>כותרת המאמר</TableHead>
                        <TableHead>תאריך</TableHead>
                        <TableHead>סטטוס תמונה</TableHead>
                        <TableHead>סטטוס עיבוד</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedArticles.map((article) => (
                        <ArticleRow
                          key={article.id}
                          article={article}
                          onToggleSelect={handleToggleSelect}
                          isSelected={selectedArticles.has(article.id)}
                          isGenerating={isGenerating}
                          currentlyProcessing={currentlyProcessing}
                        />
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        הקודם
                      </Button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        הבא
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generated-images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>גלריית תמונות שנוצרו</CardTitle>
              <CardDescription>
                מציג {paginatedGeneratedImages.length} מתוך {articlesWithImages.length} תמונות שנוצרו
              </CardDescription>
            </CardHeader>
            <CardContent>
              {articlesWithImages.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium">עדיין לא נוצרו תמונות</p>
                  <p className="text-gray-600">התמונות שיווצרו יוצגו כאן</p>
                </div>
              ) : (
                <>
                  {/* Pagination Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">
                      מציג {generatedImagesStartIndex + 1}-{Math.min(generatedImagesEndIndex, articlesWithImages.length)} מתוך {articlesWithImages.length} תמונות
                    </div>
                    <div className="text-sm text-gray-600">
                      עמוד {generatedImagesPage} מתוך {totalGeneratedPages}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedGeneratedImages.map((article) => (
                      <GeneratedImageCard 
                        key={`${article.id}-${generatedImagesPage}`} 
                        article={article} 
                      />
                    ))}
                  </div>

                  {/* Pagination Controls for Generated Images */}
                  {totalGeneratedPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 space-x-reverse mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGeneratedImagesPage(Math.max(1, generatedImagesPage - 1))}
                        disabled={generatedImagesPage === 1}
                      >
                        הקודם
                      </Button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalGeneratedPages) }, (_, i) => {
                        let pageNum;
                        if (totalGeneratedPages <= 5) {
                          pageNum = i + 1;
                        } else if (generatedImagesPage <= 3) {
                          pageNum = i + 1;
                        } else if (generatedImagesPage >= totalGeneratedPages - 2) {
                          pageNum = totalGeneratedPages - 4 + i;
                        } else {
                          pageNum = generatedImagesPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={generatedImagesPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setGeneratedImagesPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGeneratedImagesPage(Math.min(totalGeneratedPages, generatedImagesPage + 1))}
                        disabled={generatedImagesPage === totalGeneratedPages}
                      >
                        הבא
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>סטטיסטיקות כלליות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>סה״כ מאמרים:</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>מאמרים עם תמונות:</span>
                  <span className="font-semibold text-green-600">{stats.withImages}</span>
                </div>
                <div className="flex justify-between">
                  <span>מאמרים ללא תמונות:</span>
                  <span className="font-semibold text-red-600">{stats.withoutImages}</span>
                </div>
                <div className="flex justify-between">
                  <span>אחוז כיסוי תמונות:</span>
                  <span className="font-semibold text-blue-600">
                    {stats.total > 0 ? Math.round((stats.withImages / stats.total) * 100) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ביצועי יצירת תמונות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>תמונות שנוצרו בהצלחה:</span>
                  <span className="font-semibold text-green-600">{stats.successful}</span>
                </div>
                <div className="flex justify-between">
                  <span>יצירות שנכשלו:</span>
                  <span className="font-semibold text-red-600">{stats.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span>סה״כ עובדו:</span>
                  <span className="font-semibold">{stats.processed}</span>
                </div>
                {stats.processed > 0 && (
                  <div className="flex justify-between">
                    <span>אחוז הצלחה:</span>
                    <span className="font-semibold text-blue-600">
                      {Math.round((stats.successful / stats.processed) * 100)}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
