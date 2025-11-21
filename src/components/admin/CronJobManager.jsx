import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Clock, Copy, CheckCircle, RefreshCw, Zap, AlertCircle, ExternalLink } from 'lucide-react';

export default function CronJobManager() {
  const [cronUrls, setCronUrls] = useState({
    clearCache: '',
    refreshData: '',
    optimizeImages: '',
    generateSitemap: ''
  });
  const [cacheDuration, setCacheDuration] = useState('5');
  const [copied, setCopied] = useState('');
  const [cacheEnabled, setCacheEnabled] = useState(true);
  const [articlesCache, setArticlesCache] = useState({
    enabled: false,
    duration: '10'
  });
  const [cronJobsStatus, setCronJobsStatus] = useState({
    refreshData: false,
    clearCache: false,
    optimizeImages: false,
    generateSitemap: false
  });

  useEffect(() => {
    // Generate CRON URLs based on current domain
    const baseUrl = window.location.origin;
    const functionBaseUrl = baseUrl.replace('https://', 'https://').replace('.base44.app', '.base44.run');
    
    setCronUrls({
      clearCache: `${functionBaseUrl}/refreshLayoutCache`,
      refreshData: `${functionBaseUrl}/warmupCache`,
      optimizeImages: `${baseUrl}/api/cron/optimize-images`,
      generateSitemap: `${baseUrl}/api/cron/generate-sitemap`
    });

    // Load cache settings from localStorage
    const savedDuration = localStorage.getItem('cache_duration');
    const savedEnabled = localStorage.getItem('cache_enabled');
    if (savedDuration) setCacheDuration(savedDuration);
    if (savedEnabled !== null) setCacheEnabled(savedEnabled === 'true');

    // Load articles cache settings
    const savedArticlesCacheEnabled = localStorage.getItem('articles_cache_enabled');
    const savedArticlesCacheDuration = localStorage.getItem('articles_cache_duration');
    if (savedArticlesCacheEnabled !== null) {
      setArticlesCache(prev => ({ ...prev, enabled: savedArticlesCacheEnabled === 'true' }));
    }
    if (savedArticlesCacheDuration) {
      setArticlesCache(prev => ({ ...prev, duration: savedArticlesCacheDuration }));
    }

    // Load CRON jobs status
    const savedCronStatus = localStorage.getItem('cron_jobs_status');
    if (savedCronStatus) {
      try {
        setCronJobsStatus(JSON.parse(savedCronStatus));
      } catch (e) {
        console.error('Failed to parse cron status:', e);
      }
    }
  }, []);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleSaveCacheSettings = () => {
    localStorage.setItem('cache_duration', cacheDuration);
    localStorage.setItem('cache_enabled', cacheEnabled.toString());
    
    // Clear current cache to apply new settings
    sessionStorage.removeItem('layout_cache_data');
    
    alert('הגדרות Cache נשמרו בהצלחה! העמוד ירענן כדי להחיל את השינויים.');
    window.location.reload();
  };

  const handleClearCache = () => {
    sessionStorage.removeItem('layout_cache_data');
    sessionStorage.removeItem('articles_cache_data');
    sessionStorage.removeItem('category_cache_data');
    localStorage.removeItem('cache_duration');
    localStorage.removeItem('cache_enabled');
    alert('Cache נוקה בהצלחה!');
    window.location.reload();
  };

  const handleSaveArticlesCache = () => {
    localStorage.setItem('articles_cache_enabled', articlesCache.enabled.toString());
    localStorage.setItem('articles_cache_duration', articlesCache.duration);
    
    if (!articlesCache.enabled) {
      sessionStorage.removeItem('articles_cache_data');
      sessionStorage.removeItem('category_cache_data');
    }
    
    alert('הגדרות Cache מאמרים נשמרו בהצלחה! העמוד ירענן כדי להחיל את השינויים.');
    window.location.reload();
  };

  const toggleCronJobStatus = (jobId) => {
    const newStatus = {
      ...cronJobsStatus,
      [jobId]: !cronJobsStatus[jobId]
    };
    setCronJobsStatus(newStatus);
    localStorage.setItem('cron_jobs_status', JSON.stringify(newStatus));
  };

  const cronJobs = [
    {
      id: 'refreshData',
      title: 'רענון Layout Cache (גבוה)',
      description: 'מרענן תפריט, מודעות והגדרות - מפחית קריאות שרת בצורה משמעותית',
      url: cronUrls.refreshData,
      recommended: 'כל דקה (מומלץ מאוד)',
      cronExpression: '* * * * *',
      icon: Zap,
      priority: 'high'
    },
    {
      id: 'clearCache',
      title: 'חימום Cache נתונים (גבוה)',
      description: 'טוען מראש מאמרים, קטגוריות ונתונים נוספים לזיכרון',
      url: cronUrls.clearCache,
      recommended: 'כל 5 דקות',
      cronExpression: '*/5 * * * *',
      icon: RefreshCw,
      priority: 'high'
    },
    {
      id: 'optimizeImages',
      title: 'אופטימיזציית תמונות',
      description: 'מפעיל אוטומטית אופטימיזציה של תמונות חדשות',
      url: cronUrls.optimizeImages,
      recommended: 'כל 6 שעות',
      cronExpression: '0 */6 * * *',
      icon: AlertCircle,
      priority: 'medium'
    },
    {
      id: 'generateSitemap',
      title: 'יצירת Sitemap',
      description: 'מייצר sitemap מעודכן לאתר עבור מנועי חיפוש',
      url: cronUrls.generateSitemap,
      recommended: 'פעם ביום בשעה 02:00',
      cronExpression: '0 2 * * *',
      icon: ExternalLink,
      priority: 'low'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">ניהול CRON Jobs ו-Cache</h2>
            <p className="text-gray-600">הגדר משימות מתוזמנות ונהל זיכרון מטמון</p>
          </div>
        </div>
      </div>

      {/* Cache Settings */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרות Cache (זיכרון מטמון)</CardTitle>
          <CardDescription>
            Cache מפחית את מספר הקריאות לשרת על ידי שמירת נתונים בדפדפן למשך זמן מוגדר
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout Cache */}
          <div className="border-b pb-6">
            <h3 className="font-semibold text-lg mb-4">Cache תפריט ומודעות</h3>
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-blue-900">הפעלת Cache</h4>
              <p className="text-sm text-blue-700">מפחית קריאות שרת באופן משמעותי</p>
            </div>
            <Switch
              checked={cacheEnabled}
              onCheckedChange={setCacheEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>משך זמן Cache (דקות)</Label>
            <Select value={cacheDuration} onValueChange={setCacheDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 דקה</SelectItem>
                <SelectItem value="5">5 דקות (מומלץ)</SelectItem>
                <SelectItem value="10">10 דקות</SelectItem>
                <SelectItem value="30">30 דקות</SelectItem>
                <SelectItem value="60">שעה</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              לאחר פרק זמן זה, הנתונים ייטענו מחדש מהשרת
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSaveCacheSettings} className="bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="w-4 h-4 ml-2" />
              שמור הגדרות
            </Button>
            <Button variant="outline" onClick={handleClearCache}>
              <RefreshCw className="w-4 h-4 ml-2" />
              נקה Cache עכשיו
            </Button>
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>הערה:</strong> Cache נשמר ב-sessionStorage ומתנקה אוטומטית כאשר המשתמש סוגר את הלשונית.
              המשתמש תמיד יראה נתונים מעודכנים לאחר {cacheDuration} דקות או רענון ידני של העמוד.
            </AlertDescription>
          </Alert>
          </div>

          {/* Articles Cache */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Cache מאמרים וקטגוריות</h3>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-4">
              <div>
                <h4 className="font-semibold text-green-900">הפעלת Cache מאמרים</h4>
                <p className="text-sm text-green-700">טוען את כל המאמרים פעם אחת ושומר אותם בזיכרון</p>
              </div>
              <Switch
                checked={articlesCache.enabled}
                onCheckedChange={(checked) => setArticlesCache(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="space-y-2 mb-4">
              <Label>משך זמן Cache מאמרים (דקות)</Label>
              <Select 
                value={articlesCache.duration} 
                onValueChange={(value) => setArticlesCache(prev => ({ ...prev, duration: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 דקות</SelectItem>
                  <SelectItem value="10">10 דקות (מומלץ)</SelectItem>
                  <SelectItem value="15">15 דקות</SelectItem>
                  <SelectItem value="30">30 דקות</SelectItem>
                  <SelectItem value="60">שעה</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                כל המאמרים והקטגוריות ייטענו פעם אחת וייסננו בצד הלקוח
              </p>
            </div>

            <Button onClick={handleSaveArticlesCache} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="w-4 h-4 ml-2" />
              שמור הגדרות Cache מאמרים
            </Button>

            <Alert className="mt-4 bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>יתרונות:</strong> פחות קריאות שרת, טעינה מהירה יותר של דפי קטגוריות ומאמרים, חוויית גלישה חלקה יותר.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* CRON Jobs Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרת CRON Jobs חיצוניים</CardTitle>
          <CardDescription>
            השתמש בשירות כמו <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">cron-job.org</a> או <a href="https://www.easycron.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">EasyCron</a> להפעלת משימות מתוזמנות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>שימוש:</strong>
              <ol className="list-decimal mr-4 mt-2 space-y-1">
                <li>היכנס לשירות CRON Job חיצוני (למשל cron-job.org)</li>
                <li>צור CRON Job חדש</li>
                <li>העתק את הכתובת הרלוונטית מהרשימה למטה</li>
                <li>הגדר את תדירות ההפעלה (השתמש ב-Cron Expression המומלץ)</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {cronJobs.map((job) => {
              const Icon = job.icon;
              const priorityColors = {
                high: 'border-red-300 bg-red-50',
                medium: 'border-yellow-300 bg-yellow-50',
                low: 'border-gray-300 bg-gray-50'
              };
              const priorityBadges = {
                high: 'bg-red-100 text-red-800',
                medium: 'bg-yellow-100 text-yellow-800',
                low: 'bg-gray-100 text-gray-800'
              };
              const isActive = cronJobsStatus[job.id];
              return (
                <div key={job.id} className={`border-2 rounded-lg p-4 space-y-3 ${priorityColors[job.priority] || ''} ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 space-x-reverse flex-1">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          {job.priority === 'high' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadges.high}`}>
                              עדיפות גבוהה
                            </span>
                          )}
                          {isActive && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              פעיל
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{job.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleCronJobStatus(job.id)}
                      />
                      <span className="text-xs text-gray-500">
                        {isActive ? 'מופעל' : 'כבוי'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600">כתובת URL:</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(job.url, job.id)}
                      >
                        {copied === job.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 ml-1 text-green-600" />
                            הועתק
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 ml-1" />
                            העתק
                          </>
                        )}
                      </Button>
                    </div>
                    <Input
                      value={job.url}
                      readOnly
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-gray-600">תדירות מומלצת:</Label>
                      <p className="font-medium">{job.recommended}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Cron Expression:</Label>
                      <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {job.cronExpression}
                      </code>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>חשוב מאוד:</strong> הגדר את שני ה-CRON Jobs עם עדיפות גבוהה (רענון Layout Cache כל דקה + חימום Cache כל 5 דקות) כדי להפחית את העומס על השרת באופן דרמטי! אל תשכח לסמן אותם כפעילים עם המתג בצד.
            </AlertDescription>
          </Alert>
          
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>טיפ:</strong> אם אתה משתמש ב-cron-job.org, בחר "Advanced" בעת יצירת ה-job כדי להזין את ה-Cron Expression המדויק.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>מידע נוסף</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">מהו Cron Expression?</h4>
            <p>Cron Expression הוא פורמט לתזמון משימות. לדוגמה:</p>
            <ul className="list-disc mr-6 mt-1 space-y-1">
              <li><code className="bg-gray-100 px-1 rounded">*/30 * * * *</code> = כל 30 דקות</li>
              <li><code className="bg-gray-100 px-1 rounded">0 3 * * *</code> = בשעה 03:00 מדי יום</li>
              <li><code className="bg-gray-100 px-1 rounded">0 */6 * * *</code> = כל 6 שעות</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">איך Cache עובד?</h4>
            <p>
              כאשר Cache מופעל, נתוני התפריט, המודעות וההגדרות נשמרים בדפדפן של המשתמש למשך הזמן שהגדרת.
              זה מפחית באופן דרמטי את מספר הקריאות לשרת ומשפר את מהירות הטעינה של האתר.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-1">מה ההבדל?</h4>
            <ul className="list-disc mr-6 mt-1 space-y-1">
              <li><strong>Cache:</strong> חוסך קריאות שרת עבור כל משתמש בנפרד</li>
              <li><strong>CRON Jobs:</strong> מבצעים משימות תחזוקה אוטומטיות בשרת</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}