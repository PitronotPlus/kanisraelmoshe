
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Save, Eye, Newspaper, Video, CloudSun, Calendar, DollarSign, Rss, ShoppingCart, Archive, Zap, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { HomeConfig } from "@/entities/HomeConfig"; // Import HomeConfig entity

const defaultSidebarConfig = [
  { 
    id: 'breaking_news', 
    title: 'חדשות מתפרצות', 
    enabled: true, 
    icon: Rss, 
    count: 5,
    type: 'news_feed'
  },
  { 
    id: 'sports_flash', 
    title: 'מבזקי ספורט', 
    enabled: true, 
    icon: Newspaper, 
    count: 5,
    type: 'news_feed'
  },
  { 
    id: 'weather', 
    title: 'מזג אוויר', 
    enabled: true, 
    icon: CloudSun,
    type: 'weather',
    location: 'תל אביב'
  },
  { 
    id: 'events_calendar', 
    title: 'לוח אירועים', 
    enabled: true, 
    icon: Calendar,
    type: 'events'
  },
  { 
    id: 'currency_exchange', 
    title: 'שערי חליפין', 
    enabled: true, 
    icon: DollarSign,
    type: 'currency',
    currencies: ['USD', 'EUR', 'GBP']
  },
  { 
    id: 'most_viewed', 
    title: 'הכתבות הנצפות ביותר', 
    enabled: true, 
    icon: Eye, 
    count: 5,
    type: 'popular_articles'
  },
  { 
    id: 'google_news', 
    title: 'מבזקי חדשות (Google)', 
    enabled: true, 
    icon: Rss, 
    count: 5,
    type: 'google_news',
    query: 'ישראל חדשות'
  },
  { 
    id: 'video', 
    title: 'וידאו', 
    enabled: true, 
    icon: Video,
    type: 'video',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'וידאו מומלץ'
  },
  { 
    id: 'ad_sidebar_top', 
    title: 'פרסומת עליונה', 
    enabled: true, 
    icon: Zap, 
    position: 'sidebar_top',
    type: 'advertisement',
    adType: 'html',
    htmlCode: '',
    jsCode: '',
    imageUrl: '',
    linkUrl: ''
  },
  { 
    id: 'aliexpress', 
    title: 'AliExpress', 
    enabled: true, 
    icon: ShoppingCart,
    type: 'aliexpress',
    affiliateId: '',
    categories: ['אלקטרוניקה', 'בית וגן', 'אופנה']
  },
  { 
    id: 'archive', 
    title: 'ארכיון', 
    enabled: true, 
    icon: Archive,
    type: 'archive',
    displayType: 'monthly'
  },
  { 
    id: 'ad_sidebar_bottom', 
    title: 'פרסומת תחתונה', 
    enabled: true, 
    icon: Zap, 
    position: 'sidebar_bottom',
    type: 'advertisement',
    adType: 'html',
    htmlCode: '',
    jsCode: '',
    imageUrl: '',
    linkUrl: ''
  },
];

export default function SidebarEditor() {
  const [sidebarConfig, setSidebarConfig] = useState(defaultSidebarConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [tempWidgetData, setTempWidgetData] = useState(null);
  const [configId, setConfigId] = useState(null); // New state for config ID

  useEffect(() => {
    const loadSidebarConfig = async () => {
      try {
        // Load from database instead of localStorage
        const configResults = await HomeConfig.filter({ config_key: 'sidebarConfig' });
        
        if (configResults.length > 0) {
          const savedData = configResults[0].config_data;
          const savedConfig = savedData ? savedData.widgets : null;
          setConfigId(configResults[0].id);
          
          if (savedConfig && Array.isArray(savedConfig)) {
            const savedOrder = savedConfig.map(w => w.id);
            
            const mergedConfig = defaultSidebarConfig
              .map(defaultWidget => {
                  const savedWidget = savedConfig.find(w => w.id === defaultWidget.id);
                  return savedWidget ? { ...defaultWidget, ...savedWidget } : defaultWidget;
              })
              .sort((a, b) => {
                  const indexA = savedOrder.indexOf(a.id);
                  const indexB = savedOrder.indexOf(b.id);
                  // If an item is not in the savedOrder, it's a new default item.
                  // Place new default items at the end while preserving order of existing items.
                  if (indexA === -1) return 1; 
                  if (indexB === -1) return -1;
                  return indexA - indexB;
              });
            
            setSidebarConfig(mergedConfig);
          } else {
            // If config_data exists but is not a valid array, use default
            setSidebarConfig(defaultSidebarConfig);
          }
        } else {
          // No config found in DB, use default
          setSidebarConfig(defaultSidebarConfig);
        }
      } catch (error) {
        console.error("Error loading sidebar config from database:", error);
        setSidebarConfig(defaultSidebarConfig); // Fallback to default on error
      }
    };

    loadSidebarConfig();
  }, []);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const configToSave = sidebarConfig.map(widget => {
        const { icon, ...rest } = widget; // Destructure to remove non-serializable 'icon' component
        return rest;
      });

      const dataToSave = { widgets: configToSave }; // Wrap array in an object

      if (configId) {
        // Update existing config
        await HomeConfig.update(configId, { config_data: dataToSave });
      } else {
        // Create new config
        const newConfig = await HomeConfig.create({
          config_key: 'sidebarConfig',
          config_data: dataToSave
        });
        setConfigId(newConfig.id);
      }
      
      alert('תצורת סרגל הצד נשמרה בהצלחה!');
    } catch (error) {
      console.error('Error saving sidebar config to database:', error);
      alert('שגיאה בשמירת התצורה');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(sidebarConfig);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSidebarConfig(items);
  };

  const toggleWidget = (id) => {
    setSidebarConfig(
      sidebarConfig.map(widget =>
        widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
      )
    );
  };

  const handleEditClick = (widget) => {
    setEditingWidget(widget);
    setTempWidgetData({ ...widget });
  };

  const handleUpdateWidget = () => {
    if (!tempWidgetData) return;
    setSidebarConfig(
      sidebarConfig.map(widget =>
        widget.id === tempWidgetData.id ? tempWidgetData : widget
      )
    );
    setEditingWidget(null);
    setTempWidgetData(null);
  };

  const renderEditFields = () => {
    if (!tempWidgetData) return null;

    const commonFields = (
      <div className="space-y-2">
        <Label htmlFor="widget-title">כותרת הרכיב</Label>
        <Input
          id="widget-title"
          value={tempWidgetData.title}
          onChange={(e) => setTempWidgetData({ ...tempWidgetData, title: e.target.value })}
        />
      </div>
    );

    switch (tempWidgetData.type) {
      case 'news_feed':
      case 'popular_articles':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="widget-count">מספר פריטים להצגה</Label>
              <Input
                id="widget-count"
                type="number"
                min="1"
                max="20"
                value={tempWidgetData.count}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, count: parseInt(e.target.value, 10) || 5 })}
              />
            </div>
          </>
        );

      case 'video':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="video-url">קישור וידאו (YouTube/Vimeo)</Label>
              <Input
                id="video-url"
                value={tempWidgetData.videoUrl || ''}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/embed/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-title">כותרת הוידאו</Label>
              <Input
                id="video-title"
                value={tempWidgetData.videoTitle || ''}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, videoTitle: e.target.value })}
              />
            </div>
          </>
        );

      case 'advertisement':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="ad-type">סוג פרסומת</Label>
              <Select value={tempWidgetData.adType} onValueChange={(value) => setTempWidgetData({ ...tempWidgetData, adType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="html">קוד HTML</SelectItem>
                  <SelectItem value="javascript">קוד JavaScript</SelectItem>
                  <SelectItem value="image">תמונה עם קישור</SelectItem>
                  <SelectItem value="adsense">Google AdSense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tempWidgetData.adType === 'html' && (
              <div className="space-y-2">
                <Label htmlFor="html-code">קוד HTML</Label>
                <Textarea
                  id="html-code"
                  value={tempWidgetData.htmlCode || ''}
                  onChange={(e) => setTempWidgetData({ ...tempWidgetData, htmlCode: e.target.value })}
                  placeholder="<div>הכנס כאן את קוד ה-HTML שלך</div>"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {tempWidgetData.adType === 'javascript' && (
              <div className="space-y-2">
                <Label htmlFor="js-code">קוד JavaScript</Label>
                <Textarea
                  id="js-code"
                  value={tempWidgetData.jsCode || ''}
                  onChange={(e) => setTempWidgetData({ ...tempWidgetData, jsCode: e.target.value })}
                  placeholder="(function() { /* הכנס כאן את קוד ה-JS שלך */ })();"
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {tempWidgetData.adType === 'image' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="image-url">קישור לתמונה</Label>
                  <Input
                    id="image-url"
                    value={tempWidgetData.imageUrl || ''}
                    onChange={(e) => setTempWidgetData({ ...tempWidgetData, imageUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-url">קישור יעד</Label>
                  <Input
                    id="link-url"
                    value={tempWidgetData.linkUrl || ''}
                    onChange={(e) => setTempWidgetData({ ...tempWidgetData, linkUrl: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
              </>
            )}

            {tempWidgetData.adType === 'adsense' && (
              <div className="space-y-2">
                <Label htmlFor="adsense-code">קוד Google AdSense</Label>
                <Textarea
                  id="adsense-code"
                  value={tempWidgetData.htmlCode || ''}
                  onChange={(e) => setTempWidgetData({ ...tempWidgetData, htmlCode: e.target.value })}
                  placeholder="<script async src=&quot;https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js&quot;></script>..."
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>
            )}
          </>
        );

      case 'weather':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="weather-location">מיקום</Label>
              <Input
                id="weather-location"
                value={tempWidgetData.location || ''}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, location: e.target.value })}
                placeholder="תל אביב"
              />
            </div>
          </>
        );

      case 'google_news':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="widget-count">מספר כתבות להצגה</Label>
              <Input
                id="widget-count"
                type="number"
                min="1"
                max="20"
                value={tempWidgetData.count}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, count: parseInt(e.target.value, 10) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-query">מילות מפתח לחיפוש</Label>
              <Input
                id="news-query"
                value={tempWidgetData.query || ''}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, query: e.target.value })}
                placeholder="ישראל חדשות"
              />
            </div>
          </>
        );

      case 'aliexpress':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="affiliate-id">קוד שותף AliExpress</Label>
              <Input
                id="affiliate-id"
                value={tempWidgetData.affiliateId || ''}
                onChange={(e) => setTempWidgetData({ ...tempWidgetData, affiliateId: e.target.value })}
                placeholder="מזהה השותף שלך"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categories">קטגוריות (מופרדות בפסיק)</Label>
              <Input
                id="categories"
                value={tempWidgetData.categories?.join(', ') || ''}
                onChange={(e) => setTempWidgetData({ 
                  ...tempWidgetData, 
                  categories: e.target.value.split(',').map(cat => cat.trim()).filter(Boolean)
                })}
                placeholder="אלקטרוניקה, בית וגן, אופנה"
              />
            </div>
          </>
        );

      case 'currency':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="currencies">מטבעות להצגה (מופרדים בפסיק)</Label>
              <Input
                id="currencies"
                value={tempWidgetData.currencies?.join(', ') || ''}
                onChange={(e) => setTempWidgetData({ 
                  ...tempWidgetData, 
                  currencies: e.target.value.split(',').map(cur => cur.trim().toUpperCase()).filter(Boolean)
                })}
                placeholder="USD, EUR, GBP"
              />
            </div>
          </>
        );

      case 'archive':
        return (
          <>
            {commonFields}
            <div className="space-y-2">
              <Label htmlFor="display-type">סוג תצוגה</Label>
              <Select value={tempWidgetData.displayType} onValueChange={(value) => setTempWidgetData({ ...tempWidgetData, displayType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">לפי חודשים</SelectItem>
                  <SelectItem value="yearly">לפי שנים</SelectItem>
                  <SelectItem value="category">לפי קטגוריות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      default:
        return commonFields;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">עורך סרגל הצד</h3>
          <p className="text-gray-600">גרור ושחרר כדי לשנות את סדר הרכיבים בסרגל הצד</p>
        </div>
        <Button onClick={saveConfig} disabled={isSaving}>
          <Save className="w-4 h-4 ml-2" />
          {isSaving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>רכיבי סרגל הצד</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sidebar-widgets">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {sidebarConfig.map((widget, index) => (
                    <Draggable key={widget.id} draggableId={widget.id} index={index}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                          <Card className={`p-3 ${!widget.enabled ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 space-x-reverse">
                                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                <widget.icon className="w-5 h-5 text-blue-600" />
                                <span className="font-medium">{widget.title}</span>
                              </div>
                              <div className="flex items-center space-x-2 space-x-reverse">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(widget)}>
                                  <Edit className="w-4 h-4 text-gray-500" />
                                </Button>
                                <Label htmlFor={`switch-${widget.id}`}>{widget.enabled ? 'מופעל' : 'כבוי'}</Label>
                                <Switch
                                  id={`switch-${widget.id}`}
                                  checked={widget.enabled}
                                  onCheckedChange={() => toggleWidget(widget.id)}
                                />
                              </div>
                            </div>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Edit Widget Dialog */}
      {editingWidget && tempWidgetData && (
        <Dialog open={!!editingWidget} onOpenChange={() => setEditingWidget(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>עריכת רכיב: {editingWidget.title}</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {renderEditFields()}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingWidget(null)}>ביטול</Button>
              <Button onClick={handleUpdateWidget}>שמור שינויים</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
