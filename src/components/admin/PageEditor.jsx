import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GripVertical, Plus, Trash2, Edit, Save, AlertTriangle, Square, Home as HomeIcon } from "lucide-react";
import { Category } from "@/entities/Category";
import { Article } from "@/entities/Article";
import { HomeConfig } from "@/entities/HomeConfig";
import { defaultHomeConfig } from "./HomePageEditor";

const GridStyleSelector = ({ selectedStyle, onSelect }) => {
  const styles = [
    { id: 'hierarchical-1', label: 'היררכי 1', icon: <div className="grid grid-cols-4 grid-rows-2 gap-0.5 w-full h-full p-0.5"><div className="col-span-2 row-span-2 bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400 col-span-2"></div></div>, articles: 5 },
    { id: 'hierarchical-2', label: 'היררכי 2', icon: <div className="grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-full p-0.5"><div className="col-span-2 row-span-2 bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div></div>, articles: 3 },
    { id: 'modular-2x2', label: 'מודולרי 2x2', icon: <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full p-0.5"><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div></div>, articles: 4 },
    { id: 'column', label: 'עמודות', icon: <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5"><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div><div className="bg-slate-400"></div></div>, articles: 4 },
    { id: 'kan-naim-original', label: 'כאן נעים המקורי', icon: <div className="grid grid-cols-12 gap-0.5 w-full h-full p-0.5"><div className="col-span-5 bg-slate-400"></div><div className="col-span-4 bg-slate-400"></div><div className="col-span-3 bg-slate-500"></div></div>, articles: 3 },
    { id: 'cards', label: 'כרטיסיות', icon: <Square className="w-6 h-6 text-slate-500" />, articles: 5 },
  ];

  return (
    <div className="space-y-3">
      <Label>סגנון תצוגה</Label>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
            <span className="text-xs text-gray-500">({style.articles} מאמרים)</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SectionEditor = ({ section, onUpdate, onDelete, categories, articles, dragHandleProps }) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(section);

  useEffect(() => {
    const initialDisplay = section.type === 'articles' || section.type === 'slider'
      ? {
          showExcerpt: true,
          showDate: true,
          showAuthor: true,
          showComments: true,
          ...(section.display || {}),
        }
      : section.display || {};

    setEditData({ ...section, display: initialDisplay });
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
                {(section.type === 'articles' || section.type === 'slider') ?
                  `${section.articleCount} מאמרים מקטגוריה: ${section.category} ${section.type === 'slider' ? '(סליידר)' : ''}` :
                  section.type === 'special_alert' ?
                    `מבזק מיוחד - ${section.article_title || 'לא נבחר מאמר'}` :
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
              </>
            )}

            {(section.type === 'articles' || section.type === 'slider') && (
              <div className="md:col-span-2">
                <Label className="text-base font-semibold">הגדרות תצוגה</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={editData.display?.showExcerpt !== false}
                      onCheckedChange={(checked) => setEditData({
                        ...editData,
                        display: { ...(editData.display || {}), showExcerpt: checked }
                      })}
                    />
                    <Label className="text-sm">הצג תקציר</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={editData.display?.showDate !== false}
                      onCheckedChange={(checked) => setEditData({
                        ...editData,
                        display: { ...(editData.display || {}), showDate: checked }
                      })}
                    />
                    <Label className="text-sm">הצג תאריך</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={editData.display?.showAuthor !== false}
                      onCheckedChange={(checked) => setEditData({
                        ...editData,
                        display: { ...(editData.display || {}), showAuthor: checked }
                      })}
                    />
                    <Label className="text-sm">הצג כותב</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={editData.display?.showComments !== false}
                      onCheckedChange={(checked) => setEditData({
                        ...editData,
                        display: { ...(editData.display || {}), showComments: checked }
                      })}
                    />
                    <Label className="text-sm">הצג תגובות</Label>
                  </div>
                </div>
              </div>
            )}

            {section.type === 'special_alert' && (
              <div>
                <Label>בחר מאמר למבזק</Label>
                <Select
                  value={editData.article_id}
                  onValueChange={(value) => {
                    const selectedArticle = articles.find(a => a.id === value);
                    setEditData({
                      ...editData,
                      article_id: value,
                      article_title: selectedArticle ? selectedArticle.title : ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מאמר" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.map(article => (
                      <SelectItem key={article.id} value={article.id}>{article.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

export default function PageEditor() {
  const [selectedPage, setSelectedPage] = useState('homePage');
  const [config, setConfig] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const configResults = await HomeConfig.filter({ config_key: selectedPage });
        let loadedConfig = selectedPage === 'homePage' ? defaultHomeConfig : {
          hero: {
            enabled: true,
            articleCount: 5,
            showBreakingNews: false,
            type: 'grid',
            grid_style: 'hierarchical-1',
            showPrimaryAd: false, // Default for new pages
          },
          sections: []
        };
        let loadedConfigId = null;

        if (configResults.length > 0) {
          loadedConfig = configResults[0].config_data;
          loadedConfigId = configResults[0].id;
        }

        loadedConfig = {
          ...(selectedPage === 'homePage' ? defaultHomeConfig : {}),
          ...loadedConfig,
          hero: {
            ...(selectedPage === 'homePage' ? defaultHomeConfig.hero : {}),
            ...(loadedConfig.hero || {}),
            grid_style: loadedConfig.hero?.grid_style || 'hierarchical-1',
            redMailLink: loadedConfig.hero?.redMailLink || 'mailto:kanisraelnews@gmail.com',
            showPrimaryAd: loadedConfig.hero?.showPrimaryAd ?? false // Default to false if not set
          },
          sections: (loadedConfig.sections || []).map(section => {
            let updatedSection = { ...section };
            if (section.type === 'articles' || section.type === 'slider') {
                updatedSection.display = {
                    showExcerpt: true,
                    showDate: true,
                    showAuthor: true,
                    showComments: true,
                    ...(section.display || {})
                };
            }
            return updatedSection;
          })
        };

        const [categoriesData, articlesData] = await Promise.all([
          Category.list(),
          Article.filter({ published: true }, '-created_date', 100)
        ]);

        setConfig(loadedConfig);
        setConfigId(loadedConfigId);
        setCategories(categoriesData.filter(c => !c.parent_id));
        setArticles(articlesData);
      } catch (error) {
        console.error("Error loading data:", error);
        setConfig(selectedPage === 'homePage' ? defaultHomeConfig : { hero: { enabled: false }, sections: [] });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedPage]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      if (configId) {
        await HomeConfig.update(configId, { config_data: config });
      } else {
        const newConfigEntry = await HomeConfig.create({
          config_key: selectedPage,
          config_data: config
        });
        setConfigId(newConfigEntry.id);
      }
      alert("התצורה נשמרה בהצלחה!");
    } catch (error) {
      console.error("Error saving config:", error);
      alert("שגיאה בשמירת התצורה.");
    } finally {
      setSaving(false);
    }
  };

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
          category: categories[0]?.name || 'כללי',
          colorClass: 'blue',
          articleCount: 4,
          display: {
            showExcerpt: true,
            showDate: true,
            showAuthor: true,
            showComments: true,
          }
        };
        break;
      case 'slider':
        newSection = {
          ...newSection,
          title: 'סליידר מאמרים',
          category: categories[0]?.name || 'כללי',
          articleCount: 6,
          display: {
            showExcerpt: true,
            showDate: true,
            showAuthor: true,
            showComments: true,
          }
        };
        break;
      case 'special_alert':
        newSection = {
          ...newSection,
          title: 'מבזק מיוחד',
          article_id: '',
          article_title: ''
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
      sections: [...prevConfig.sections, newSection]
    }));
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    setConfig(prevConfig => {
      const newSections = [...prevConfig.sections];
      const [reorderedItem] = newSections.splice(result.source.index, 1);
      newSections.splice(result.destination.index, 0, reorderedItem);
      return { ...prevConfig, sections: newSections };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-500">טוען נתונים...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-xl">
        שגיאה: לא ניתן לטעון את תצורת הדף.
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">עורך דפים</h3>
            <p className="text-gray-600">בחר דף לעריכה וגרור ושחרר כדי לשנות את סדר הסקשנים</p>
          </div>
          <div className="flex space-x-2 space-x-reverse">
            <Button onClick={handleSaveConfig} disabled={saving}>
              {saving ? 'שומר...' : 'שמור שינויים'}
            </Button>
          </div>
        </div>

        {/* Page Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <HomeIcon className="w-5 h-5" />
              <span>בחירת דף לעריכה</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Label>בחר דף:</Label>
              <Select value={selectedPage} onValueChange={setSelectedPage}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homePage">דף הבית</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={`category_${cat.slug}`}>
                      קטגוריה: {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Hero Section Settings */}
        <Card>
          <CardHeader>
            <CardTitle>הגדרות Hero Section</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Switch
                checked={config.hero?.enabled ?? true}
                onCheckedChange={(enabled) =>
                  setConfig({ ...config, hero: { ...config.hero, enabled } })
                }
              />
              <Label>הפעל Hero</Label>
            </div>
            {config.hero?.enabled && (
              <>
                <div className="border p-4 rounded-lg space-y-4 bg-gray-50/50">
                  <GridStyleSelector
                    selectedStyle={config.hero.grid_style}
                    onSelect={(style) => setConfig({ ...config, hero: { ...config.hero, grid_style: style }})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>מספר מאמרים</Label>
                    <Input
                      type="number"
                      value={config.hero.articleCount}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, articleCount: parseInt(e.target.value) }
                        })
                      }
                      min="3"
                      max="10"
                    />
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse pt-6">
                    <Switch
                      checked={config.hero.showBreakingNews}
                      onCheckedChange={(showBreakingNews) =>
                        setConfig({ ...config, hero: { ...config.hero, showBreakingNews } })
                      }
                    />
                    <Label>הצג מבזקים</Label>
                  </div>
                </div>

                {config.hero.grid_style === 'kan-naim-original' && (
                  <div>
                    <Label>קישור כפתור המייל האדום</Label>
                    <Input
                      type="text"
                      value={config.hero.redMailLink || ''}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, redMailLink: e.target.value }
                        })
                      }
                      placeholder="mailto:kanisraelnews@gmail.com או קישור אחר"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      הזן קישור mailto: או קישור פנימי/חיצוני לכפתור המייל האדום
                    </p>
                  </div>
                )}

                {/* Hero Primary Ad Section */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center space-x-2 space-x-reverse mb-4">
                    <Switch
                      checked={config.hero.showPrimaryAd !== false}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          hero: { ...config.hero, showPrimaryAd: checked }
                        })
                      }
                    />
                    <Label className="text-base font-semibold">הצג מודעות ראשי</Label>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    מודעה שתופיע על כל הרוחב מתחת למקטע ה-Hero ולפני שאר הסקשנים
                  </p>
                </div>
                </>
                )}
                </CardContent>
                </Card>

                {/* Primary Video Section Settings */}
                <Card>
                <CardHeader>
                <CardTitle>הגדרות מקטע וידאו ראשי</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                checked={config.primaryVideo?.enabled ?? true}
                onCheckedChange={(enabled) =>
                  setConfig({ ...config, primaryVideo: { ...config.primaryVideo, enabled } })
                }
                />
                <Label>הפעל מקטע וידאו ראשי</Label>
                </div>
                {config.primaryVideo?.enabled && (
                <div>
                <Label>כותרת המקטע</Label>
                <Input
                  value={config.primaryVideo?.title || 'חדשות'}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      primaryVideo: { ...config.primaryVideo, title: e.target.value }
                    })
                  }
                />
                </div>
                )}
                </CardContent>
                </Card>

        {/* Sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>סקשנים</CardTitle>
              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSection('articles')}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  סקשן מאמרים
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSection('slider')}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  סליידר מאמרים
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSection('special_alert')}
                >
                  <AlertTriangle className="w-4 h-4 ml-1" />
                  מבזק מיוחד
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSection('ad')}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  מודעה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addSection('adsense')}
                >
                  <Plus className="w-4 h-4 ml-1" />
                  AdSense
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Droppable droppableId="sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {config.sections.map((section, index) => (
                    <Draggable
                      key={section.id}
                      draggableId={section.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <SectionEditor
                            section={section}
                            onUpdate={updateSection}
                            onDelete={deleteSection}
                            categories={categories}
                            articles={articles}
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
          </CardContent>
        </Card>
      </div>
    </DragDropContext>
  );
}