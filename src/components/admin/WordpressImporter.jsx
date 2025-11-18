import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadCloud, FileText, CheckCircle, XCircle, Settings, Eye, ArrowRight } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import { importFromWordpress } from "@/functions/importFromWordpress";
import { parseCsv } from "@/functions/parseCsv";
import { Category } from "@/entities/Category";
import { Article } from "@/entities/Article";
import { Progress } from "@/components/ui/progress";

const FIELD_MAPPINGS = {
  title: { label: 'כותרת', required: true, suggestions: ['title', 'post_title', 'headline', 'name', 'כותרת'] },
  content: { label: 'תוכן', required: true, suggestions: ['content', 'post_content', 'body', 'text', 'description', 'תוכן'] },
  excerpt: { label: 'תקציר', required: false, suggestions: ['excerpt', 'summary', 'abstract', 'post_excerpt', 'תקציר'] },
  featured_image: { label: 'תמונה ראשית', required: false, suggestions: ['featured_image', 'image', 'thumbnail', 'photo', 'תמונה', 'image_url'] },
  author: { label: 'כותב', required: false, suggestions: ['author', 'post_author', 'writer', 'by', 'כותב'] },
  tags: { label: 'תגיות', required: false, suggestions: ['tags', 'keywords', 'labels', 'post_tag', 'תגיות'] },
  status: { label: 'סטטוס פרסום', required: false, suggestions: ['status', 'post_status', 'publication_status'] },
  category: { label: 'קטגוריה', required: false, suggestions: ['category', 'post_category', 'section', 'type', 'קטגוריה'] },
  original_publication_date: { label: 'תאריך פרסום', required: false, suggestions: ['date', 'post_date', 'published', 'publish_date', 'תאריך'] }
};

const FieldMappingRow = ({ fieldKey, fieldInfo, csvHeaders, mappings, onMappingChange }) => {
  const currentMapping = mappings[fieldKey];
  
  return (
    <div className="grid grid-cols-3 gap-4 items-center py-2 border-b">
      <div>
        <Label className={`font-medium ${fieldInfo.required ? 'text-red-600' : 'text-gray-700'}`}>
          {fieldInfo.label} {fieldInfo.required && '*'}
        </Label>
      </div>
      <div>
        <Select value={currentMapping || ''} onValueChange={(value) => onMappingChange(fieldKey, value)}>
          <SelectTrigger>
            <SelectValue placeholder="בחר עמודה..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>לא ייובא</SelectItem>
            {csvHeaders.map(header => (
              <SelectItem key={header} value={header}>{header}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-gray-500">
        {fieldInfo.suggestions.slice(0, 3).join(', ')}
      </div>
    </div>
  );
};

const DataPreview = ({ data, mappings }) => {
  const previewData = data.slice(0, 3);
  
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">תצוגה מקדימה (3 שורות ראשונות):</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-50">
            <tr>
              {Object.entries(mappings).filter(([_, value]) => value).map(([field, csvColumn]) => (
                <th key={field} className="p-2 text-right border">
                  {FIELD_MAPPINGS[field]?.label || field}
                  <div className="text-xs text-gray-500">({csvColumn})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, index) => (
              <tr key={index} className="border-b">
                {Object.entries(mappings).filter(([_, value]) => value).map(([field, csvColumn]) => (
                  <td key={field} className="p-2 border max-w-32 truncate">
                    {String(row[csvColumn] || '').substring(0, 50)}
                    {String(row[csvColumn] || '').length > 50 && '...'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function WordpressImporter() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]); // New state for multiple files
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState(null); 
  const [categories, setCategories] = useState([]);
  
  const [currentStep, setCurrentStep] = useState('upload');
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [fieldMappings, setFieldMappings] = useState({});
  const [createNewCategories, setCreateNewCategories] = useState(true);
  const [fallbackCategory, setFallbackCategory] = useState("");
  const [importPublishState, setImportPublishState] = useState('publish_all');
  const [skipThinContent, setSkipThinContent] = useState(false);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ processed: 0, total: 0, successful: 0, failed: 0, categoriesCreated: 0, errors: [], currentFile: '', completedFiles: 0, totalFiles: 0 });
  const [importLogs, setImportLogs] = useState([]);
  const [showDetailedLogs, setShowDetailedLogs] = useState(false); 
  const logContainerRef = useRef(null);

  const [fieldOptions, setFieldOptions] = useState([]);
  const [isSingleFile, setIsSingleFile] = useState(true); // New state to toggle between single/multiple file mode
  const [xmlContent, setXmlContent] = useState(''); // For manual XML paste
  const [xmlImportStep, setXmlImportStep] = useState('paste'); // paste, processing, complete

  useEffect(() => {
    // Dynamically generate field options from Article schema
    // Ensure Article.schema() and its properties exist and are structured as expected
    try {
      const schema = Article.schema();
      const options = Object.keys(schema.properties).map(key => ({
        value: key,
        label: schema.properties[key].description || key,
      }));
      // Add a specific option for original publication date for clarity
      options.push({ value: 'original_publication_date', label: 'תאריך פרסום מקורי' });
      setFieldOptions(options);
    } catch (error) {
      console.error("Failed to load Article schema for field options:", error);
      // Fallback or handle error if Article.schema() is not available or structured incorrectly
    }
  }, []);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await Category.list();
        const mainCategories = cats.filter(c => !c.parent_id);
        setCategories(mainCategories);
        if (mainCategories.length > 0) {
          setFallbackCategory(mainCategories[0].name);
        }
      } catch (e) {
        console.error("Failed to load categories", e);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [importLogs]);

  const autoDetectMappings = (headers) => {
    const mappings = {};
    
    Object.entries(FIELD_MAPPINGS).forEach(([fieldKey, fieldInfo]) => {
      const matchedHeader = headers.find(header => 
        fieldInfo.suggestions.some(suggestion => 
          header.toLowerCase().includes(suggestion.toLowerCase()) ||
          suggestion.toLowerCase().includes(header.toLowerCase())
        )
      );
      if (matchedHeader) {
        mappings[fieldKey] = matchedHeader;
      }
    });
    
    return mappings;
  };

  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    if (isSingleFile && selectedFiles.length > 1) {
      alert('במצב קובץ יחיד, ניתן לבחור קובץ אחד בלבד');
      event.target.value = ''; // Clear selected files
      return;
    }
    
    setFiles(selectedFiles); // Store all selected files
    setFile(selectedFiles[0]); // Keep the first file for backward compatibility (e.g., for `file && (<div>`)
    setIsLoading(true);
    setImportResult(null);
    setImportLogs([]);
    setShowDetailedLogs(false);
    
    try {
      // Process first file for mapping setup
      const firstFile = selectedFiles[0];
      const { file_url } = await UploadFile({ file: firstFile });
      
      const { data: parseResult } = await parseCsv({ file_url });

      if (parseResult.success) {
          const { data, headers } = parseResult;

          const cleanData = data.filter(row => row && Object.values(row).some(val => val !== null && val !== ''));
          
          if (cleanData.length === 0) {
              throw new Error('לא ניתן היה למצוא נתונים תקינים בקובץ ה-CSV הראשון.');
          }
          
          setCsvData(cleanData); // Data for preview/initial mapping from first file
          setCsvHeaders(headers); // Headers for mapping from first file
          setFieldMappings(autoDetectMappings(headers));
          setCurrentStep('mapping');
      } else {
          throw new Error(parseResult.message || 'ניתוח הקובץ הראשון נכשל.');
      }
    } catch (error) {
      console.error("File analysis failed:", error);
      setImportResult({ success: false, message: `שגיאה בניתוח הקובץ: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMappingChange = (field, csvColumn) => {
    setFieldMappings(prev => ({
      ...prev,
      [field]: csvColumn === '' ? undefined : csvColumn
    }));
  };

  const validateMappings = () => {
    const errors = [];
    
    Object.entries(FIELD_MAPPINGS).forEach(([fieldKey, fieldInfo]) => {
      if (fieldInfo.required && !fieldMappings[fieldKey]) {
        errors.push(`שדה חובה "${fieldInfo.label}" לא ממופה`);
      }
    });
    
    return errors;
  };

  const handleStartImport = async () => {
    setIsImporting(true);
    setCurrentStep('import');
    setImportResult(null);
    
    // Initialize progress for all files
    const totalFilesCount = files.length;
    setImportProgress({ 
      processed: 0, 
      total: 0, 
      successful: 0, 
      failed: 0, 
      categoriesCreated: 0, 
      errors: [],
      currentFile: '',
      completedFiles: 0,
      totalFiles: totalFilesCount
    });
    setImportLogs([]);
    setShowDetailedLogs(true);

    const validationErrors = validateMappings();
    if (validationErrors.length > 0) {
      setImportLogs(prev => [...prev, '❌ שגיאות מיפוי נתונים קריטיות. הייבוא בוטל:']);
      validationErrors.forEach(err => setImportLogs(prev => [...prev, `   • ${err}`]));
      setImportProgress(prev => ({ ...prev, errors: [...prev.errors, ...validationErrors] }));
      setIsImporting(false);
      return;
    }
    
    if (!fallbackCategory) {
      const errorMessage = '❌ לא נבחרה קטגוריית ברירת מחדל. הייבוא בוטל.';
      setImportLogs(prev => [...prev, errorMessage]);
      setImportProgress(prev => ({ ...prev, errors: [...prev.errors, errorMessage] }));
      setIsImporting(false);
      return;
    }

    // Process each file sequentially
    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const currentFile = files[fileIndex];
      setImportLogs(prev => [...prev, `\n📁 מעבד קובץ ${fileIndex + 1}/${totalFilesCount}: ${currentFile.name}`]);
      setImportProgress(prev => ({ ...prev, currentFile: currentFile.name }));

      try {
        // Upload and parse current file
        const { file_url } = await UploadFile({ file: currentFile });
        const { data: parseResult } = await parseCsv({ file_url });

        if (!parseResult.success) {
          throw new Error(`נכשל בניתוח הקובץ ${currentFile.name}: ${parseResult.message}`);
        }

        const cleanData = parseResult.data.filter(row => row && Object.values(row).some(val => val !== null && val !== ''));
        
        if (cleanData.length === 0) {
          setImportLogs(prev => [...prev, `⚠️ הקובץ ${currentFile.name} ריק או לא מכיל נתונים תקינים - דולג`]);
          setImportProgress(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
          continue;
        }

        setImportProgress(prev => ({ ...prev, total: prev.total + cleanData.length }));
        setImportLogs(prev => [...prev, `📊 הקובץ ${currentFile.name} מכיל ${cleanData.length} מאמרים`]);

        // Process file in batches
        const BATCH_SIZE = 10;
        const totalBatches = Math.ceil(cleanData.length / BATCH_SIZE);
        let consecutiveErrors = 0;

        for (let i = 0; i < totalBatches; i++) {
            const batchData = cleanData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
            
            setImportLogs(prev => [...prev, `🔄 מעבד מנה ${i+1}/${totalBatches} מהקובץ ${currentFile.name} (${batchData.length} מאמרים)...`]);
            
            try {
                const { data: result } = await importFromWordpress({ 
                    batchData,
                    fieldMappings,
                    createNewCategories,
                    fallbackCategory,
                    importPublishState,
                    skipThinContent
                });
                
                consecutiveErrors = 0;
                if (result.success && result.details) {
                    setImportProgress(prev => ({
                        ...prev,
                        processed: prev.processed + batchData.length,
                        successful: prev.successful + (result.details.successfulInBatch || 0),
                        failed: prev.failed + (result.details.failedInBatch || 0),
                        categoriesCreated: prev.categoriesCreated + (result.details.categoriesCreatedInBatch || 0),
                        errors: [...prev.errors, ...(result.details.errorsInBatch || [])]
                    }));

                    if (result.details.logs) {
                        setImportLogs(prev => [...prev, ...result.details.logs]);
                    }

                    if (result.details.failedInBatch > 0) {
                        const errorMessages = result.details.errorsInBatch.map(err => `   • ${err}`).join('\n');
                        setImportLogs(prev => [...prev, `⚠️ אירעו ${result.details.failedInBatch} שגיאות נתונים במנה ${i+1}. ממשיך אוטומטית...`]);
                        setImportLogs(prev => [...prev, errorMessages]);
                    }
                } else {
                    throw new Error(result.message || "שגיאה לא ידועה בעיבוד המנה");
                }
                
                await new Promise(res => setTimeout(res, 1000));

            } catch (error) {
                consecutiveErrors++;
                console.error(`Batch ${i+1} of file ${currentFile.name} failed:`, error);
                const errorMessage = error.message || "שגיאת שרת לא ידועה";
                
                const waitTime = Math.min(15 * Math.pow(2, consecutiveErrors - 1), 120);
                
                setImportLogs(prev => [...prev, `❌ שגיאה במנה ${i+1} מהקובץ ${currentFile.name}: ${errorMessage}`]);
                setImportLogs(prev => [...prev, `🛑 Cooldown: ממתין ${waitTime} שניות באופן אוטומטי לפני ניסיון חוזר...`]);
                
                await new Promise(res => setTimeout(res, waitTime * 1000));
                
                setImportLogs(prev => [...prev, `🔄 מנסה לעבד שוב את מנה ${i+1} מהקובץ ${currentFile.name}...`]);
                i--;
                continue;
            }
        }

        // Mark file as completed
        setImportProgress(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
        setImportLogs(prev => [...prev, `✅ הקובץ ${currentFile.name} הושלם בהצלחה!`]);

        // Add delay between files
        if (fileIndex < files.length - 1) {
          setImportLogs(prev => [...prev, '--- ממתין 3 שניות לפני הקובץ הבא ---']);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        setImportLogs(prev => [...prev, `❌ שגיאה קריטית בעיבוד הקובץ ${currentFile.name}: ${error.message}`]);
        setImportProgress(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
      }
    }

    setIsImporting(false);
    setImportLogs(prev => [...prev, `\n🎉 כל הקבצים הושלמו! עובדו ${files.length} קבצים בסה"כ.`]);
  };

  const resetImporter = () => {
    setFile(null);
    setFiles([]);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMappings({});
    setCurrentStep('upload');
    setImportResult(null);
    setIsImporting(false);
    setImportProgress({ processed: 0, total: 0, successful: 0, failed: 0, categoriesCreated: 0, errors: [], currentFile: '', completedFiles: 0, totalFiles: 0 });
    setImportPublishState('publish_all');
    setSkipThinContent(false);
    setImportLogs([]);
    setShowDetailedLogs(false);
    setIsSingleFile(true);
  };
  
  const finalResult = !isImporting && importProgress.totalFiles > 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>ייבוא מאמרים מתקדם</CardTitle>
        <CardDescription>
          העלה קובץ או קבצי CSV מרובים, מפה את השדות באופן חכם, ובחר אפשרויות ייבוא מתקדמות
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={currentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" disabled={currentStep !== 'upload'}>העלאת קבצים</TabsTrigger>
            <TabsTrigger value="xml" disabled={currentStep !== 'upload'}>ייבוא XML ידני</TabsTrigger>
            <TabsTrigger value="mapping" disabled={currentStep === 'upload'}>מיפוי שדות</TabsTrigger>
            <TabsTrigger value="import" disabled={currentStep === 'upload' || currentStep === 'mapping'}>ייבוא</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 space-x-reverse mb-4">
                <input
                  type="checkbox"
                  id="multiple-files"
                  checked={!isSingleFile}
                  onChange={(e) => setIsSingleFile(!e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="multiple-files">העלה מספר קבצים בבת אחת</Label>
              </div>

              <div>
                <Label htmlFor="csv-file">
                  {isSingleFile ? 'בחר קובץ CSV' : 'בחר קבצי CSV מרובים'}
                </Label>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv,text/csv" 
                  multiple={!isSingleFile}
                  onChange={handleFileChange}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isSingleFile ? 
                    'קובץ CSV יחיד למיפוי וייבוא' : 
                    'מספר קבצי CSV שיעובדו באופן אוטומטי עם אותן הגדרות מיפוי'
                  }
                </p>
              </div>
              
              {(file || files.length > 0) && (
                <div className="space-y-2">
                  {isSingleFile ? (
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg border">
                      <FileText className="w-5 h-5 ml-3 text-blue-600" />
                      <span className="font-medium">{file.name}</span>
                      {isLoading && (
                        <div className="mr-auto flex items-center">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                          מנתח קובץ...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700">נבחרו {files.length} קבצים:</div>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center p-2 bg-blue-50 rounded border text-sm">
                            <FileText className="w-4 h-4 ml-2 text-blue-600" />
                            <span>{file.name}</span>
                            {index === 0 && isLoading && (
                              <div className="mr-auto flex items-center">
                                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                                מנתח...
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="xml" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="xml-content">הדבק את תוכן ה-XML כאן</Label>
                <p className="text-sm text-gray-600 mb-2">
                  הדבק את תוכן קובץ ה-XML המלא. המערכת תעבד אותו בשלבים גם אם הוא ארוך מאוד.
                </p>
                <textarea
                  id="xml-content"
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                  placeholder="<?xml version=&quot;1.0&quot; encoding=&quot;UTF-8&quot;?>
<rss version=&quot;2.0&quot;>
  <channel>
    <item>...</item>
  </channel>
</rss>"
                  className="w-full h-96 p-4 border rounded-lg font-mono text-xs"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ניתן להדביק תוכן ארוך - המערכת תעבד אותו בשלבים
                </p>
              </div>

              {xmlContent.trim() && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center text-blue-800">
                    <FileText className="w-5 h-5 ml-2" />
                    <span className="font-medium">
                      נמצאו {xmlContent.length.toLocaleString()} תווים
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => { setXmlContent(''); setCurrentStep('upload'); }}>
                  חזור
                </Button>
                <Button 
                  onClick={async () => {
                    if (!xmlContent.trim()) {
                      alert('אנא הדבק תוכן XML');
                      return;
                    }
                    
                    setIsLoading(true);
                    setImportLogs([]);
                    
                    try {
                      // Parse XML content
                      const parser = new DOMParser();
                      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
                      
                      // Check for parsing errors
                      const parserError = xmlDoc.getElementsByTagName('parsererror');
                      if (parserError.length > 0) {
                        throw new Error('שגיאה בניתוח ה-XML. ודא שהתוכן תקין.');
                      }
                      
                      // Extract articles from XML
                      const items = xmlDoc.getElementsByTagName('item');
                      if (items.length === 0) {
                        throw new Error('לא נמצאו מאמרים (אלמנטים <item>) בתוך ה-XML.');
                      }
                      
                      const articles = [];
                      for (let i = 0; i < items.length; i++) {
                        const item = items[i];
                        const article = {};
                        
                        // Extract common WordPress XML fields
                        const titleEl = item.getElementsByTagName('title')[0];
                        if (titleEl) article.title = titleEl.textContent;
                        
                        const contentEl = item.getElementsByTagNameNS('*', 'encoded')[0] || 
                                         item.getElementsByTagName('content:encoded')[0] ||
                                         item.getElementsByTagName('description')[0];
                        if (contentEl) article.content = contentEl.textContent;
                        
                        const excerptEl = item.getElementsByTagNameNS('*', 'excerpt')[0] || 
                                         item.getElementsByTagName('excerpt:encoded')[0];
                        if (excerptEl) article.excerpt = excerptEl.textContent;
                        
                        const linkEl = item.getElementsByTagName('link')[0];
                        if (linkEl) article.original_source_url = linkEl.textContent;
                        
                        const pubDateEl = item.getElementsByTagName('pubDate')[0];
                        if (pubDateEl) article.original_publication_date = pubDateEl.textContent;
                        
                        const creatorEl = item.getElementsByTagNameNS('*', 'creator')[0] ||
                                         item.getElementsByTagName('dc:creator')[0];
                        if (creatorEl) article.author = creatorEl.textContent;
                        
                        // Extract categories
                        const categories = item.getElementsByTagName('category');
                        if (categories.length > 0) {
                          const cats = [];
                          for (let j = 0; j < categories.length; j++) {
                            const catText = categories[j].textContent;
                            if (catText && catText.trim()) cats.push(catText);
                          }
                          article.category = cats[0] || '';
                          article.tags = cats.join(', ');
                        }
                        
                        // Status
                        const statusEl = item.getElementsByTagNameNS('*', 'status')[0];
                        if (statusEl) article.status = statusEl.textContent;
                        
                        articles.push(article);
                      }
                      
                      if (articles.length === 0) {
                        throw new Error('לא ניתן לחלץ מאמרים מה-XML.');
                      }
                      
                      // Create headers from first article
                      const headers = Object.keys(articles[0]);
                      
                      setCsvData(articles);
                      setCsvHeaders(headers);
                      setFieldMappings(autoDetectMappings(headers));
                      setCurrentStep('mapping');
                      setImportLogs([`✅ נטענו ${articles.length} מאמרים מה-XML בהצלחה`]);
                    } catch (error) {
                      console.error('XML parsing error:', error);
                      alert(`שגיאה בעיבוד ה-XML: ${error.message}`);
                      setImportLogs([`❌ שגיאה: ${error.message}`]);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={!xmlContent.trim() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      מעבד XML...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 ml-2" />
                      המשך למיפוי
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-6 mt-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">מיפוי שדות</h3>
                <p className="text-sm text-gray-600 mb-4">
                  מיפוי אוטומטי זוהה על בסיס שמות העמודות. ניתן לשנות או להשלים ידנית.
                </p>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-gray-700 pb-2">
                    <div>שדה במערכת</div>
                    <div>עמודה בקובץ</div>
                    <div>הצעות זיהוי</div>
                  </div>
                  
                  {Object.entries(FIELD_MAPPINGS).map(([fieldKey, fieldInfo]) => (
                    <FieldMappingRow
                      key={fieldKey}
                      fieldKey={fieldKey}
                      fieldInfo={fieldInfo}
                      csvHeaders={csvHeaders}
                      mappings={fieldMappings}
                      onMappingChange={handleMappingChange}
                    />
                  ))}
                </div>
              </div>

              <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">הגדרות קטגוריות</h4>
                  <div className="space-y-4">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="create-categories"
                          checked={createNewCategories}
                          onCheckedChange={setCreateNewCategories}
                        />
                        <Label htmlFor="create-categories">צור קטגוריות חדשות אוטומטית</Label>
                      </div>
                      
                      <div>
                        <Label>קטגוריית ברירת מחדל</Label>
                        <Select value={fallbackCategory} onValueChange={setFallbackCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר קטגוריה..." />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">הגדרות פרסום</h4>
                  <div>
                      <Label>סטטוס מאמרים בייבוא</Label>
                      <Select value={importPublishState} onValueChange={setImportPublishState}>
                          <SelectTrigger>
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="publish_all">פרסם את כל המאמרים (ברירת מחדל)</SelectItem>
                              <SelectItem value="draft_all">שמור את כל המאמרים כטיוטה</SelectItem>
                              <SelectItem value="from_file">שימוש בעמודה מהקובץ (דורש מיפוי "סטטוס פרסום")</SelectItem>
                          </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">קובע אם המאמרים המיובאים יפורסמו או יישמרו כטיוטה. ברירת המחדל החדשה: פרסום מיידי.</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold mb-4">הגדרות ייבוא מתקדמות</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id="skip-thin-content"
                      checked={skipThinContent}
                      onCheckedChange={setSkipThinContent}
                    />
                    <Label htmlFor="skip-thin-content">דלג על מאמרים עם תוכן דל</Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    מאמרים עם פחות מ-100 מילים בשדה התוכן לא ייובאו.
                  </p>
                </div>
              </div>

              {csvData.length > 0 && Object.values(fieldMappings).some(Boolean) && (
                <DataPreview data={csvData} mappings={fieldMappings} />
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetImporter}>
                  התחל מחדש
                </Button>
                <Button onClick={handleStartImport} disabled={!Object.values(fieldMappings).some(Boolean)}>
                  <ArrowRight className="w-4 h-4 ml-2" />
                  המשך לייבוא
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-6 mt-6">
            <div className="text-center">
              {isImporting ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <h3 className="text-lg font-semibold">מייבא מאמרים...</h3>
                  {importProgress.totalFiles > 1 ? (
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        קובץ {importProgress.completedFiles + 1} מתוך {importProgress.totalFiles}: {importProgress.currentFile}
                      </p>
                      <p className="text-gray-600">
                        מעבד מאמר {Math.min(importProgress.processed, importProgress.total)} מתוך {importProgress.total} (סה"כ מכל הקבצים)
                      </p>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">התקדמות קבצים:</div>
                        <Progress value={(importProgress.completedFiles / importProgress.totalFiles) * 100} className="w-full h-2" />
                      </div>
                      {importProgress.total > 0 && (
                        <div className="space-y-1">
                          <div className="text-sm text-gray-500">התקדמות מאמרים:</div>
                          <Progress value={(importProgress.processed / importProgress.total) * 100} className="w-full h-2" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        מעבד מאמר {Math.min(importProgress.processed, importProgress.total)} מתוך {importProgress.total}
                      </p>
                      <Progress value={(importProgress.processed / importProgress.total) * 100} className="w-full" />
                    </div>
                  )}
                  <div className="text-sm text-gray-500 pt-2">
                      <span>הצלחות: {importProgress.successful}</span> | 
                      <span> כשלונות: {importProgress.failed}</span> | 
                      <span> קטגוריות חדשות: {importProgress.categoriesCreated}</span>
                  </div>
                  <p className="text-sm text-orange-600">נא לא לסגור את החלון במהלך הייבוא</p>
                </div>
              ) : finalResult ? (
                <div className={`p-6 rounded-lg ${importProgress.failed === 0 ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'}`}>
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">
                    ייבוא הושלם!
                  </h3>
                  <div className="text-sm space-y-1 mb-4">
                    {importProgress.totalFiles > 0 && <div>עובדו {importProgress.totalFiles} קבצים</div>}
                    <div>סה"כ מאמרים לעיבוד: {importProgress.total}</div>
                    <div className="font-semibold text-green-600">יובאו בהצלחה: {importProgress.successful}</div>
                    <div className={`font-semibold ${importProgress.failed > 0 ? 'text-red-600' : 'text-gray-600'}`}>נכשלו: {importProgress.failed}</div>
                    {importProgress.categoriesCreated > 0 && (
                      <div>קטגוריות חדשות נוצרו: {importProgress.categoriesCreated}</div>
                    )}
                  </div>
                  
                  {importProgress.errors.length > 0 && (
                      <div className="mt-4 text-left p-2 bg-red-100 rounded border border-red-200 max-h-40 overflow-y-auto">
                          <h4 className="font-bold text-red-800">פירוט שגיאות:</h4>
                          <ul className="list-disc list-inside text-xs text-red-700">
                              {importProgress.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                              {importProgress.errors.length > 10 && <li>...ועוד {importProgress.errors.length - 10} שגיאות</li>}
                          </ul>
                      </div>
                  )}
                  
                  <Button onClick={resetImporter} className="mt-4">
                    יבא קובץ נוסף
                  </Button>
                </div>
              ) : null}

              {/* Detailed Logs Section - Always visible during and after import based on showDetailedLogs state */}
              {showDetailedLogs && importLogs.length > 0 && (
                <div className="mt-6 text-left">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-semibold">לוגים מפורטים</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDetailedLogs(false)}
                    >
                      הסתר לוגים
                    </Button>
                  </div>
                  <div 
                    ref={logContainerRef} 
                    className="p-4 bg-gray-900 text-green-400 font-mono text-xs rounded-lg max-h-96 overflow-y-auto shadow-inner border"
                  >
                    {importLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className={`whitespace-pre-wrap py-0.5 ${
                          log.includes('❌') ? 'text-red-400' : 
                          log.includes('✅') ? 'text-green-400' : 
                          log.includes('🔄') ? 'text-blue-400' :
                          log.includes('🖼️') ? 'text-purple-400' :
                          log.includes('📝') ? 'text-yellow-400' :
                          log.includes('💾') ? 'text-cyan-400' :
                          'text-gray-300'
                        }`}
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Logs Button - only when logs are hidden and exist */}
              {!showDetailedLogs && importLogs.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDetailedLogs(true)}
                  >
                    הצג לוגים מפורטים ({importLogs.length})
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}