
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, LayoutGrid, Palette, Settings, Save, GripVertical, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const GridStyleSelector = ({ selectedStyle, onSelect }) => {
  const styles = [
    { id: 'hierarchical-1', label: 'היררכי 1 (5)', icon: <div className="grid grid-cols-4 grid-rows-2 gap-0.5 w-full h-full p-0.5"><div className="col-span-2 row-span-2 bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400 col-span-2"></div></div> },
    { id: 'hierarchical-2', label: 'היררכי 2 (3)', icon: <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full p-0.5"><div className="col-span-2 row-span-2 bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div></div> },
    { id: 'modular-2x2', label: 'מודולרי 2x2 (4)', icon: <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full p-0.5"><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div></div> },
    { id: 'column', label: 'עמודות (4)', icon: <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5"><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div></div> },
  ];

  return (
    <div className="space-y-3">
      <Label>סגנון גריד</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {styles.map(style => (
          <button
            key={style.id}
            type="button"
            onClick={() => onSelect(style.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${selectedStyle === style.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-400'}`}
          >
            <div className="w-16 h-10 mb-2 flex items-center justify-center">
              {style.icon}
            </div>
            <span className="text-xs font-medium text-center">{style.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SectionEditor = ({ section, onUpdate, onDelete, categories, dragHandleProps }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(section);

  useEffect(() => {
    setEditData(section);
  }, [section]);

  const handleSave = () => {
    onUpdate(editData);
    setEditing(false);
  };

  const colorOptions = [
    { value: 'red', label: 'אדום', class: 'bg-red-600' },
    { value: 'green', label: 'ירוק', class: 'bg-green-600' },
    { value: 'blue', label: 'כחול', class: 'bg-blue-600' },
    { value: 'purple', label: 'סגול', class: 'bg-purple-600' },
    { value: 'yellow', label: 'צהוב', class: 'bg-yellow-600' },
    { value: 'indigo', label: 'אינדיגו', class: 'bg-indigo-600' }
  ];

  const getSectionIcon = (type) => {
    switch (type) {
      case 'articles': return '📰';
      case 'slider': return '🎞️';
      case 'hot_articles': return '🔥';
      case 'ad': return '📢';
      case 'adsense': return '🎯';
      case 'special_alert': return '🚨';
      default: return '📄';
    }
  };

  return (
    <Card className={`mb-4 ${!section.enabled ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div {...dragHandleProps}>
              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
            </div>
            <span className="text-lg">{getSectionIcon(section.type)}</span>
            <div>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <p className="text-sm text-gray-500">
                {section.type === 'articles' || section.type === 'slider' ?
                  `${section.articleCount} מאמרים מקטגוריה: ${section.category} ${section.type === 'slider' ? '(סליידר)' : ''}` :
                  section.type === 'hot_articles' ?
                    'סקשן מאמרים חמים' :
                    `${section.type === 'ad' ? 'מודעה' : 'AdSense'} - ${section.position}`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              checked={section.enabled}
              onCheckedChange={(enabled) => onUpdate({ ...section, enabled })}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(section.id)}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {editing && (
        <CardContent className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>כותרת</Label>
              <Input
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              />
            </div>

            {(section.type === 'articles' || section.type === 'slider') && (
              <>
                <div>
                  <Label>קטגוריה</Label>
                  <Select
                    value={editData.category}
                    onValueChange={(value) => setEditData({ ...editData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>מספר מאמרים</Label>
                  <Input
                    type="number"
                    value={editData.articleCount}
                    onChange={(e) => setEditData({ ...editData, articleCount: parseInt(e.target.value) })}
                    min="1"
                    max="20"
                  />
                </div>

                {section.type === 'articles' && (
                  <div>
                    <Label>צבע</Label>
                    <Select
                      value={editData.colorClass}
                      onValueChange={(value) => setEditData({ ...editData, colorClass: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map(color => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <div className={`w-4 h-4 rounded ${color.class}`}></div>
                              <span>{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* הגדרות תצוגה למאמרים */}
                <div className="md:col-span-2">
                  <Label className="text-base font-semibold">הגדרות תצוגה</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={editData.display?.showExcerpt !== false}
                        onCheckedChange={(checked) => setEditData({
                          ...editData,
                          display: { ...editData.display, showExcerpt: checked }
                        })}
                      />
                      <Label className="text-sm">הצג תקציר</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={editData.display?.showDate !== false}
                        onCheckedChange={(checked) => setEditData({
                          ...editData,
                          display: { ...editData.display, showDate: checked }
                        })}
                      />
                      <Label className="text-sm">הצג תאריך</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={editData.display?.showAuthor !== false}
                        onCheckedChange={(checked) => setEditData({
                          ...editData,
                          display: { ...editData.display, showAuthor: checked }
                        })}
                      />
                      <Label className="text-sm">הצג כותב</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Switch
                        checked={editData.display?.showComments !== false}
                        onCheckedChange={(checked) => setEditData({
                          ...editData,
                          display: { ...editData.display, showComments: checked }
                        })}
                      />
                      <Label className="text-sm">הצג תגובות</Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {(section.type === 'ad' || section.type === 'adsense') && (
              <div>
                <Label>מיקום</Label>
                <Select
                  value={editData.position}
                  onValueChange={(value) => setEditData({ ...editData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="between_articles">בין כתבות</SelectItem>
                    <SelectItem value="large_banner">באנר גדול</SelectItem>
                    <SelectItem value="sidebar">סרגל צד</SelectItem>
                    <SelectItem value="header">כותרת עליונה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse mt-4">
            <Button variant="outline" onClick={() => setEditing(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 ml-2" />
              שמור
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function CategoryPageEditor({ category, onUpdate, allCategories }) {
  const [config, setConfig] = useState({
    hero_type: 'grid',
    hero_video_url: '',
    hero_video_title: '',
    article_count: 12,
    subcategories_display: [],
    related_categories: [],
    show_subcategory_sections: true,
    layout_style: 'classic',
    hero_grid_style: 'hierarchical-1',
    sections: [], // Add sections to category config
    ...category.page_config
  });

  const [newSubcategoryId, setNewSubcategoryId] = useState('');
  const [newRelatedId, setNewRelatedId] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Get available subcategories (children of current category)
  const availableSubcategories = allCategories.filter(cat =>
    cat.parent_id === category.id && !config.subcategories_display.includes(cat.id)
  );

  // Get available related categories (same level, not this category, not already selected)
  const availableRelatedCategories = allCategories.filter(cat =>
    cat.parent_id === category.parent_id &&
    cat.id !== category.id &&
    !config.related_categories.includes(cat.id)
  );

  const handleConfigChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
  };

  const handleSave = () => {
    onUpdate({ ...category, page_config: config });
    setIsOpen(false);
  };

  // Section management functions
  const updateSection = (updatedSection) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      sections: prevConfig.sections.map(section =>
        section.id === updatedSection.id ? updatedSection : section
      )
    }));
  };

  const deleteSection = (sectionId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק סקשן זה?')) {
      setConfig(prevConfig => ({
        ...prevConfig,
        sections: prevConfig.sections.filter(section => section.id !== sectionId)
      }));
    }
  };

  const addSection = (type) => {
    const newId = `section_${new Date().getTime()}`;
    let newSection = {
      id: newId,
      title: 'סקשן חדש',
      enabled: true,
      type
    };

    switch (type) {
      case 'articles':
        newSection = {
          ...newSection,
          title: 'סקשן מאמרים חדש',
          category: allCategories[0]?.name || 'כללי', // Default to first category name
          colorClass: 'blue',
          articleCount: 4,
          display: {
            showExcerpt: true,
            showDate: true,
            showAuthor: true,
            showComments: true
          }
        };
        break;
      case 'slider':
        newSection = {
          ...newSection,
          title: 'סליידר מאמרים',
          category: allCategories[0]?.name || 'כללי', // Default to first category name
          articleCount: 6,
          display: {
            showExcerpt: true,
            showDate: true,
            showAuthor: true,
            showComments: true
          }
        };
        break;
      case 'hot_articles':
        newSection = {
          ...newSection,
          title: 'מאמרים חמים'
        };
        break;
      case 'ad':
        newSection = {
          ...newSection,
          title: 'מודעה חדשה',
          position: 'between_articles'
        };
        break;
      case 'adsense':
        newSection = {
          ...newSection,
          title: 'AdSense חדש',
          position: 'large_banner'
        };
        break;
      default:
        return;
    }

    setConfig(prevConfig => ({
      ...prevConfig,
      sections: [...(prevConfig.sections || []), newSection]
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    setConfig(prevConfig => {
      const newSections = [...(prevConfig.sections || [])];
      const [reorderedItem] = newSections.splice(result.source.index, 1);
      newSections.splice(result.destination.index, 0, reorderedItem);
      return { ...prevConfig, sections: newSections };
    });
  };

  const addSubcategory = () => {
    if (newSubcategoryId) {
      const newList = [...config.subcategories_display, newSubcategoryId];
      setConfig({ ...config, subcategories_display: newList });
      setNewSubcategoryId('');
    }
  };

  const removeSubcategory = (subcatId) => {
    const newList = config.subcategories_display.filter(id => id !== subcatId);
    setConfig({ ...config, subcategories_display: newList });
  };

  const addRelatedCategory = () => {
    if (newRelatedId) {
      const newList = [...config.related_categories, newRelatedId];
      setConfig({ ...config, related_categories: newList });
      setNewRelatedId('');
    }
  };

  const removeRelatedCategory = (catId) => {
    const newList = config.related_categories.filter(id => id !== catId);
    setConfig({ ...config, related_categories: newList });
  };

  const getCategoryName = (categoryId) => {
    const cat = allCategories.find(c => c.id === categoryId);
    return cat ? cat.name : 'לא נמצא';
  };

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    let videoId = '';
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('/embed/')) {
      videoId = url.split('/embed/')[1].split('?')[0];
    }
    
    if (videoId) {
        const params = new URLSearchParams({
            autoplay: 1,
            mute: 1,
            controls: 0,
            showinfo: 0,
            rel: 0,
            loop: 1,
            playsinline: 1,
            playlist: videoId // Required for looping a single video
        });
        return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }
    return url;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-4">
            <Settings className="w-4 h-4 ml-2" />
            עיצוב דף הקטגוריה
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-6 border-b sticky top-0 bg-white z-10 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              עיצוב דף הקטגוריה: {category.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="hero" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0 p-4">
                <TabsTrigger value="hero">Hero Section</TabsTrigger>
                <TabsTrigger value="sections">סקשנים</TabsTrigger>
                <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="hero" className="space-y-6 p-6">
                  {/* Hero Section Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5 text-blue-600" />
                      הגדרות Hero Section
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>סוג Hero</Label>
                        <Select value={config.hero_type} onValueChange={(value) => handleConfigChange('hero_type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="grid">רשת מאמרים (Grid)</SelectItem>
                            <SelectItem value="video">וידאו מרכזי</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>סגנון פריסה</Label>
                        <Select value={config.layout_style} onValueChange={(value) => handleConfigChange('layout_style', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">קלאסי</SelectItem>
                            <SelectItem value="modern">מודרני</SelectItem>
                            <SelectItem value="magazine">מגזין</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {config.hero_type === 'grid' && (
                      <div className="p-4 bg-blue-50 rounded-lg space-y-4 mt-4">
                        <GridStyleSelector
                          selectedStyle={config.hero_grid_style}
                          onSelect={(style) => handleConfigChange('hero_grid_style', style)}
                        />
                      </div>
                    )}
                    
                    {config.hero_type === 'video' && (
                      <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                        <h4 className="font-medium text-blue-900">הגדרות וידאו</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>קישור לוידאו</Label>
                            <Input
                              value={config.hero_video_url}
                              onChange={(e) => handleConfigChange('hero_video_url', e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                              dir="ltr"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>כותרת הוידאו</Label>
                            <Input
                              value={config.hero_video_title}
                              onChange={(e) => handleConfigChange('hero_video_title', e.target.value)}
                              placeholder="כותרת מעניינת לוידאו..."
                            />
                          </div>
                        </div>
                        {config.hero_video_url && (
                          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <iframe
                              src={getYouTubeEmbedUrl(config.hero_video_url)}
                              className="absolute w-full h-full top-0 left-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="תצוגה מקדימה של וידאו"
                            />
                            <div className="absolute inset-0 bg-black/40"></div>
                            {config.hero_video_title && (
                              <div className="absolute inset-0 flex items-center justify-center p-2">
                                <h3 className="text-xl font-bold text-white text-center text-shadow-md">
                                  {config.hero_video_title}
                                </h3>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="sections" className="space-y-6 p-6">
                  {/* Sections Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-lg font-semibold">סקשנים בדף הקטגוריה</h3>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button variant="outline" size="sm" onClick={() => addSection('articles')}>
                          <Plus className="w-4 h-4 ml-1" />
                          סקשן מאמרים
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('slider')}>
                          <Plus className="w-4 h-4 ml-1" />
                          סליידר מאמרים
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('hot_articles')}>
                          <Plus className="w-4 h-4 ml-1" />
                          מאמרים חמים
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('ad')}>
                          <Plus className="w-4 h-4 ml-1" />
                          מודעה
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => addSection('adsense')}>
                          <Plus className="w-4 h-4 ml-1" />
                          AdSense
                        </Button>
                      </div>
                    </div>

                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="category-sections">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {(config.sections || []).map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.draggableProps}>
                                    <SectionEditor
                                      section={section}
                                      onUpdate={updateSection}
                                      onDelete={deleteSection}
                                      categories={allCategories}
                                      dragHandleProps={provided.dragHandleProps}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </TabsContent>

                <TabsContent value="general" className="space-y-6 p-6">
                  {/* General Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">הגדרות כלליות</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>מספר מאמרים בדף</Label>
                        <Input
                          type="number"
                          value={config.article_count}
                          onChange={(e) => handleConfigChange('article_count', parseInt(e.target.value))}
                          min="6"
                          max="24"
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <Label>הצג סקשנים של תתי קטגוריות</Label>
                        <Switch
                          checked={config.show_subcategory_sections}
                          onCheckedChange={(checked) => handleConfigChange('show_subcategory_sections', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subcategories */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">תתי קטגוריות להצגה</h3>
                    <p className="text-sm text-gray-600">בחר אילו תתי קטגוריות יוצגו כסקשנים נפרדים בדף</p>
                    
                    <div className="flex gap-2">
                      <Select value={newSubcategoryId} onValueChange={setNewSubcategoryId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="בחר תת-קטגוריה להוספה" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSubcategories.map(subcat => (
                            <SelectItem key={subcat.id} value={subcat.id}>{subcat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addSubcategory} disabled={!newSubcategoryId}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {config.subcategories_display.map(subcatId => (
                        <Badge key={subcatId} variant="secondary" className="flex items-center gap-1">
                          {getCategoryName(subcatId)}
                          <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeSubcategory(subcatId)} />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Related Categories */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">קטגוריות קשורות</h3>
                    <p className="text-sm text-gray-600">קטגוריות שיוצגו בסרגל הצד כהמלצות</p>
                    
                    <div className="flex gap-2">
                      <Select value={newRelatedId} onValueChange={setNewRelatedId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="בחר קטגוריה קשורה" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRelatedCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addRelatedCategory} disabled={!newRelatedId}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {config.related_categories.map(catId => (
                        <Badge key={catId} variant="outline" className="flex items-center gap-1">
                          {getCategoryName(catId)}
                          <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => removeRelatedCategory(catId)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Fixed bottom buttons */}
          <DialogFooter className="p-4 border-t bg-white flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 ml-2" />
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
