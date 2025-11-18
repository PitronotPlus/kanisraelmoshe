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

  const [isSingleFile, setIsSingleFile] = useState(true); // New state to toggle between single/multiple file mode
  const [xmlContent, setXmlContent] = useState(''); // For manual XML paste
  const [isXmlImport, setIsXmlImport] = useState(false); // Track if this is XML import



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
    
    const validationErrors = validateMappings();
    if (validationErrors.length > 0) {
      setImportLogs(prev => [...prev, '❌ שגיאות מיפוי. הייבוא בוטל:']);
      validationErrors.forEach(err => setImportLogs(prev => [...prev, `   • ${err}`]));
      setImportProgress(prev => ({ ...prev, errors: [...prev.errors, ...validationErrors] }));
      setIsImporting(false);
      return;
    }
    
    if (!fallbackCategory) {
      const errorMessage = '❌ לא נבחרה קטגוריית ברירת מחדל.';
      setImportLogs(prev => [...prev, errorMessage]);
      setImportProgress(prev => ({ ...prev, errors: [...prev.errors, errorMessage] }));
      setIsImporting(false);
      return;
    }

    // If XML import, use csvData directly (already parsed)
    if (isXmlImport) {
      setImportProgress({ 
        processed: 0, 
        total: csvData.length, 
        successful: 0, 
        failed: 0, 
        categoriesCreated: 0, 
        errors: [],
        currentFile: 'XML ידני',
        completedFiles: 0,
        totalFiles: 1
      });
      setImportLogs(['🚀 מתחיל ייבוא מ-XML ידני...']);
      setShowDetailedLogs(true);

      await processArticles(csvData, 'XML ידני');
      
      setImportProgress(prev => ({ ...prev, completedFiles: 1 }));
      setImportLogs(prev => [...prev, `\n🎉 ייבוא XML הושלם!`]);
      setIsImporting(false);
      return;
    }

    // CSV file import flow
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

    for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const currentFile = files[fileIndex];
      setImportLogs(prev => [...prev, `\n📁 מעבד קובץ ${fileIndex + 1}/${totalFilesCount}: ${currentFile.name}`]);
      setImportProgress(prev => ({ ...prev, currentFile: currentFile.name }));

      try {
        const { file_url } = await UploadFile({ file: currentFile });
        const { data: parseResult } = await parseCsv({ file_url });

        if (!parseResult.success) {
          throw new Error(`נכשל בניתוח ${currentFile.name}: ${parseResult.message}`);
        }

        const cleanData = parseResult.data.filter(row => row && Object.values(row).some(val => val !== null && val !== ''));
        
        if (cleanData.length === 0) {
          setImportLogs(prev => [...prev, `⚠️ ${currentFile.name} ריק - דולג`]);
          setImportProgress(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
          continue;
        }

        setImportProgress(prev => ({ ...prev, total: prev.total + cleanData.length }));
        setImportLogs(prev => [...prev, `📊 ${currentFile.name}: ${cleanData.length} מאמרים`]);
        
        await processArticles(cleanData, currentFile.name);



        setImportProgress(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
        setImportLogs(prev => [...prev, `✅ ${currentFile.name} הושלם!`]);

        if (fileIndex < files.length - 1) {
          setImportLogs(prev => [...prev, '--- ממתין 3 שניות ---']);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }

      } catch (error) {
        setImportLogs(prev => [...prev, `❌ שגיאה בקובץ ${currentFile.name}: ${error.message}`]);
        setImportProgress(prev => ({ ...prev, completedFiles: prev.completedFiles + 1 }));
      }
    }

    setIsImporting(false);
    setImportLogs(prev => [...prev, `\n🎉 עובדו ${files.length} קבצים!`]);
  };

  const processArticles = async (articlesData, fileName) => {
    const BATCH_SIZE = 10;
    const totalBatches = Math.ceil(articlesData.length / BATCH_SIZE);
    let consecutiveErrors = 0;

    for (let i = 0; i < totalBatches; i++) {
      const batchData = articlesData.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      
      setImportLogs(prev => [...prev, `🔄 מנה ${i+1}/${totalBatches} מ-${fileName} (${batchData.length} מאמרים)...`]);
      
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
            setImportLogs(prev => [...prev, `⚠️ ${result.details.failedInBatch} שגיאות במנה ${i+1}...`]);
            setImportLogs(prev => [...prev, errorMessages]);
          }
        } else {
          throw new Error(result.message || "שגיאה בעיבוד");
        }
        
        await new Promise(res => setTimeout(res, 1000));

      } catch (error) {
        consecutiveErrors++;
        console.error(`Batch ${i+1} failed:`, error);
        const errorMessage = error.message || "שגיאת שרת";
        const waitTime = Math.min(15 * Math.pow(2, consecutiveErrors - 1), 120);
        
        setImportLogs(prev => [...prev, `❌ שגיאה במנה ${i+1}: ${errorMessage}`]);
        setImportLogs(prev => [...prev, `🛑 ממתין ${waitTime} שניות לפני ניסיון חוזר...`]);
        
        await new Promise(res => setTimeout(res, waitTime * 1000));
        
        setImportLogs(prev => [...prev, `🔄 מנסה שוב מנה ${i+1}...`]);
        i--;
        continue;
      }
    }
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
    setXmlContent('');
    setIsXmlImport(false);
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
        <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" disabled={currentStep !== 'upload' && currentStep !== 'xml'}>העלאת קבצים</TabsTrigger>
            <TabsTrigger value="xml" disabled={currentStep !== 'upload' && currentStep !== 'xml'}>ייבוא XML ידני</TabsTrigger>
            <TabsTrigger value="mapping" disabled={currentStep === 'upload' || currentStep === 'xml'}>מיפוי שדות</TabsTrigger>
            <TabsTrigger value="import" disabled={currentStep === 'upload' || currentStep === 'xml' || currentStep === 'mapping'}>ייבוא</TabsTrigger>
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
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-bold text-orange-800 mb-2">⚠️ חשוב - איך להעתיק XML נכון:</h4>
                <ol className="list-decimal mr-5 space-y-1 text-sm text-orange-700">
                  <li>פתח את קובץ ה-XML בדפדפן</li>
                  <li><strong>לחץ Ctrl+U</strong> (או לחיצה ימנית → "View Page Source" / "הצג מקור דף")</li>
                  <li>תראה קוד XML טהור שמתחיל ב- <code className="bg-orange-100 px-1">&lt;?xml</code> או <code className="bg-orange-100 px-1">&lt;rss</code></li>
                  <li>בחר הכל (Ctrl+A) והעתק (Ctrl+C)</li>
                  <li>הדבק למטה</li>
                </ol>
                <p className="text-xs text-red-600 font-semibold mt-2">
                  ❌ אל תעתיק מהתצוגה הרגילה של הדפדפן - המערכת לא תוכל לקרוא את זה!
                </p>
              </div>
              <div>
                <Label htmlFor="xml-content">הדבק את תוכן ה-XML כאן</Label>
                <p className="text-sm text-gray-600 mb-2">
                  המערכת תעבד את ה-XML בשלבים גם אם הוא ארוך מאוד.
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
                    setImportLogs(['🔄 בודק את תוכן ה-XML...']);
                    
                    try {
                      let cleanedXml = xmlContent.trim();
                      
                      // Check if user pasted HTML instead of XML
                      if (cleanedXml.toLowerCase().includes('<!doctype html') || 
                          cleanedXml.toLowerCase().startsWith('<html') ||
                          cleanedXml.includes('This XML file does not appear')) {
                        throw new Error('❌ נראה שהעתקת HTML ולא XML!\n\n📖 לחץ Ctrl+U בדפדפן כדי לראות את קוד ה-XML המקורי, ואז העתק מהמקור.');
                      }
                      
                      // Remove HTML comments
                      cleanedXml = cleanedXml.replace(/<!--[\s\S]*?-->/g, '').trim();
                      
                      // Check if starts with valid XML
                      if (!cleanedXml.startsWith('<?xml') && !cleanedXml.startsWith('<rss') && !cleanedXml.startsWith('<feed')) {
                        throw new Error('❌ התוכן לא מתחיל בתג XML תקין.\n\n📖 ודא שהעתקת את קוד המקור (Ctrl+U) ולא את התצוגה הרגילה.');
                      }
                      
                      setImportLogs(prev => [...prev, `📄 גודל: ${cleanedXml.length.toLocaleString()} תווים`]);
                      
                      // Parse XML
                      const parser = new DOMParser();
                      const xmlDoc = parser.parseFromString(cleanedXml, 'text/xml');
                      
                      const parserError = xmlDoc.getElementsByTagName('parsererror');
                      if (parserError.length > 0) {
                        const errorText = parserError[0].textContent || 'שגיאה לא ידועה';
                        throw new Error(`שגיאת ניתוח XML: ${errorText.substring(0, 200)}`);
                      }
                      
                      setImportLogs(prev => [...prev, '✅ ה-XML נותח בהצלחה']);
                      
                      // Extract articles
                      const items = xmlDoc.getElementsByTagName('item');
                      if (items.length === 0) {
                        throw new Error('לא נמצאו מאמרים (<item>). ודא שזה קובץ WordPress XML.');
                      }
                      
                      setImportLogs(prev => [...prev, `📦 נמצאו ${items.length} מאמרים`]);
                      
                      const articles = [];
                      const batchSize = 100;
                      const totalBatches = Math.ceil(items.length / batchSize);
                      
                      for (let batch = 0; batch < totalBatches; batch++) {
                        const start = batch * batchSize;
                        const end = Math.min((batch + 1) * batchSize, items.length);
                        
                        setImportLogs(prev => [...prev, `🔄 מחלץ מאמרים ${start + 1}-${end}...`]);
                        
                        for (let i = start; i < end; i++) {
                          const item = items[i];
                          const article = {};
                          
                          const getCDATA = (element) => {
                            if (!element) return '';
                            return (element.textContent || '').trim();
                          };
                          
                          article.title = getCDATA(item.getElementsByTagName('title')[0]);
                          
                          let contentEl = item.getElementsByTagName('content:encoded')[0];
                          if (!contentEl) {
                            const allElements = item.getElementsByTagName('*');
                            for (let el of allElements) {
                              if (el.localName === 'encoded' && el.namespaceURI?.includes('content')) {
                                contentEl = el;
                                break;
                              }
                            }
                          }
                          if (!contentEl) contentEl = item.getElementsByTagName('description')[0];
                          article.content = getCDATA(contentEl);
                          
                          let excerptEl = item.getElementsByTagName('excerpt:encoded')[0];
                          if (!excerptEl) {
                            const allElements = item.getElementsByTagName('*');
                            for (let el of allElements) {
                              if (el.localName === 'encoded' && el.namespaceURI?.includes('excerpt')) {
                                excerptEl = el;
                                break;
                              }
                            }
                          }
                          article.excerpt = getCDATA(excerptEl);
                          
                          article.original_source_url = getCDATA(item.getElementsByTagName('link')[0]);
                          
                          const pubDate = getCDATA(item.getElementsByTagName('pubDate')[0]);
                          const wpPostDate = getCDATA(item.getElementsByTagName('wp:post_date')[0]);
                          article.original_publication_date = pubDate || wpPostDate;
                          
                          let authorEl = item.getElementsByTagName('dc:creator')[0];
                          if (!authorEl) {
                            const allElements = item.getElementsByTagName('*');
                            for (let el of allElements) {
                              if (el.localName === 'creator') {
                                authorEl = el;
                                break;
                              }
                            }
                          }
                          article.author = getCDATA(authorEl);
                          
                          const categoryElements = item.getElementsByTagName('category');
                          const cats = [];
                          for (let j = 0; j < categoryElements.length; j++) {
                            const domain = categoryElements[j].getAttribute('domain');
                            const catText = getCDATA(categoryElements[j]);
                            if (catText && domain === 'category') {
                              cats.push(catText);
                            }
                          }
                          if (cats.length > 0) {
                            article.category = cats[0];
                            if (cats.length > 1) {
                              article.tags = cats.slice(1).join(', ');
                            }
                          }
                          
                          const statusEl = item.getElementsByTagName('wp:status')[0];
                          article.status = getCDATA(statusEl);
                          
                          if (article.title || article.content) {
                            articles.push(article);
                          }
                        }
                        
                        if (batch < totalBatches - 1) {
                          await new Promise(resolve => setTimeout(resolve, 50));
                        }
                      }
                      
                      if (articles.length === 0) {
                        throw new Error('לא ניתן לחלץ מאמרים מה-XML.');
                      }
                      
                      setImportLogs(prev => [...prev, `✅ ${articles.length} מאמרים חולצו`]);
                      
                      const headers = ['title', 'content', 'excerpt', 'category', 'tags', 'author', 'original_publication_date', 'original_source_url', 'status'];
                      
                      // Show sample of parsed data for validation
                      setImportLogs(prev => [...prev, '\n📋 דוגמה למאמר שנחלץ:']);
                      if (articles.length > 0) {
                        const sample = articles[0];
                        setImportLogs(prev => [...prev, `   כותרת: ${sample.title?.substring(0, 80) || '❌ חסר'}`]);
                        setImportLogs(prev => [...prev, `   תוכן: ${sample.content?.substring(0, 100) || '❌ חסר'}...`]);
                        setImportLogs(prev => [...prev, `   קטגוריה: ${sample.category || 'אין'}`]);
                        setImportLogs(prev => [...prev, `   מחבר: ${sample.author || 'אין'}`]);
                      }
                      
                      setCsvData(articles);
                      setCsvHeaders(headers);
                      setFieldMappings(autoDetectMappings(headers));
                      setIsXmlImport(true);
                      setCurrentStep('mapping');
                      setImportLogs(prev => [...prev, '\n🎉 מוכן לייבוא - בדוק את המיפוי בשלב הבא!`]);
                    } catch (error) {
                      console.error('XML parsing error:', error);
                      const errorMsg = error.message || 'שגיאה לא ידועה';
                      alert(errorMsg);
                      setImportLogs(prev => [...prev, `❌ ${errorMsg}`]);
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