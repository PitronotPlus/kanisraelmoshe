import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { HomeConfig } from "@/entities/HomeConfig";
import { Category } from "@/entities/Category";
import { Article } from "@/entities/Article";
import { Plus, GripVertical, Settings, Trash2, Save, Layout, Grid, Video, Image as ImageIcon, Megaphone } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export const defaultHomeConfig = {
  hero: {
    enabled: true,
    showBreakingNews: true,
    articleCount: 5,
    grid_style: 'kan-naim-original',
    redMailLink: 'mailto:kanisraelnews@gmail.com'
  },
  sections: [
    { id: 'hot-articles', type: 'hot_articles', enabled: true, title: '🔥 מאמרים חמים' },
    { id: 'section-1', type: 'articles', category: 'main', title: 'חדשות ראשיות', articleCount: 6, enabled: true, display: { showDate: true, showAuthor: true } },
  ]
};

const GridStyleSelector = ({ value, onChange }) => {
  const styles = [
    { value: 'hierarchical-1', label: 'היררכי 1', icon: Grid, articles: 5 },
    { value: 'hierarchical-2', label: 'היררכי 2', icon: Grid, articles: 5 },
    { value: 'modular-2x2', label: 'מודולרי 2×2', icon: Grid, articles: 4 },
    { value: 'column', label: 'עמודות', icon: Grid, articles: 5 },
    { value: 'cards', label: 'כרטיסים', icon: Grid, articles: 5 },
    { value: 'kan-naim-original', label: 'כאן נעים מקורי', icon: Grid, articles: 3 },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {styles.map(style => (
        <button
          key={style.value}
          onClick={() => onChange(style.value)}
          className={`p-4 border-2 rounded-lg transition-all ${
            value === style.value
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <style.icon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm font-semibold">{style.label}</p>
          <p className="text-xs text-gray-500">{style.articles} מאמרים</p>
        </button>
      ))}
    </div>
  );
};

const SectionEditor = ({ section, categories, articles, onChange, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSectionIcon = (type) => {
    switch (type) {
      case 'articles': return Layout;
      case 'slider': return Grid;
      case 'ad': return ImageIcon;
      case 'adsense': return ImageIcon;
      case 'special_alert': return Megaphone;
      case 'hot_articles': return '🔥';
      default: return Layout;
    }
  };

  const Icon = getSectionIcon(section.type);

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <GripVertical className="w-5 h-5 text-gray-400" />
            {typeof Icon === 'string' ? (
              <span className="text-2xl">{Icon}</span>
            ) : (
              <Icon className="w-5 h-5 text-blue-600" />
            )}
            <div>
              <CardTitle className="text-base">
                {section.title || `מקטע ${section.type}`}
              </CardTitle>
              <p className="text-xs text-gray-500">
                {section.type === 'articles' && `מאמרים - ${section.category}`}
                {section.type === 'slider' && `סליידר - ${section.category}`}
                {section.type === 'ad' && 'פרסומת'}
                {section.type === 'adsense' && 'AdSense'}
                {section.type === 'special_alert' && 'התראה מיוחדת'}
                {section.type === 'hot_articles' && 'מאמרים חמים'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
            <Switch
              checked={section.enabled}
              onCheckedChange={(checked) => onChange({ ...section, enabled: checked })}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {(section.type === 'articles' || section.type === 'slider') && (
            <>
              <div>
                <Label>כותרת המקטע</Label>
                <Input
                  value={section.title || ''}
                  onChange={(e) => onChange({ ...section, title: e.target.value })}
                  placeholder="כותרת המקטע"
                />
              </div>
              
              <div>
                <Label>קטגוריה</Label>
                <Select
                  value={section.category || ''}
                  onValueChange={(value) => onChange({ ...section, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>מספר מאמרים להצגה</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={section.articleCount || 6}
                  onChange={(e) => onChange({ ...section, articleCount: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>הגדרות תצוגה</Label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={section.display?.showDate !== false}
                      onCheckedChange={(checked) => 
                        onChange({ 
                          ...section, 
                          display: { ...section.display, showDate: checked }
                        })
                      }
                    />
                    <Label>הצג תאריך</Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Switch
                      checked={section.display?.showAuthor !== false}
                      onCheckedChange={(checked) => 
                        onChange({ 
                          ...section, 
                          display: { ...section.display, showAuthor: checked }
                        })
                      }
                    />
                    <Label>הצג כותב</Label>
                  </div>
                </div>
              </div>
            </>
          )}

          {section.type === 'ad' && (
            <div>
              <Label>מיקום פרסומת</Label>
              <Select
                value={section.position || 'main_leaderboard'}
                onValueChange={(value) => onChange({ ...section, position: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main_leaderboard">באנר עליון</SelectItem>
                  <SelectItem value="between_articles">בין מאמרים</SelectItem>
                  <SelectItem value="sidebar_top">סרגל צד עליון</SelectItem>
                  <SelectItem value="sidebar_bottom">סרגל צד תחתון</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {section.type === 'adsense' && (
            <div>
              <Label>מיקום AdSense</Label>
              <Input
                value={section.position || ''}
                onChange={(e) => onChange({ ...section, position: e.target.value })}
                placeholder="לדוגמה: center-1"
              />
            </div>
          )}

          {section.type === 'special_alert' && (
            <div>
              <Label>בחר מאמר להתראה</Label>
              <Select
                value={section.article_id || ''}
                onValueChange={(value) => onChange({ ...section, article_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר מאמר" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(article => (
                    <SelectItem key={article.id} value={article.id}>
                      {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default function PageEditor() {
  const [selectedPage, setSelectedPage] = useState('homePage');
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [config, setConfig] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const pageOptions = useMemo(() => {
    const options = [
      { value: 'homePage', label: 'דף הבית', icon: Layout }
    ];
    
    categories.forEach(cat => {
      options.push({
        value: `category_${cat.slug}`,
        label: `קטגוריה: ${cat.name}`,
        icon: Grid
      });
    });
    
    return options;
  }, [categories]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadPageConfig();
  }, [selectedPage]);

  const loadInitialData = async () => {
    try {
      const [categoriesData, articlesData] = await Promise.all([
        Category.list(),
        Article.filter({ published: true }, '-created_date', 20)
      ]);
      setCategories(categoriesData);
      setArticles(articlesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadPageConfig = async () => {
    setLoading(true);
    try {
      const configData = await HomeConfig.filter({ config_key: selectedPage });
      
      if (configData.length > 0) {
        const loadedConfig = {
          ...defaultHomeConfig,
          ...configData[0].config_data,
          hero: {
            ...defaultHomeConfig.hero,
            ...(configData[0].config_data?.hero || {})
          }
        };
        setConfig(loadedConfig);
      } else {
        setConfig(defaultHomeConfig);
      }
    } catch (error) {
      console.error('Error loading page config:', error);
      setConfig(defaultHomeConfig);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const existingConfig = await HomeConfig.filter({ config_key: selectedPage });
      
      if (existingConfig.length > 0) {
        await HomeConfig.update(existingConfig[0].id, {
          config_key: selectedPage,
          config_data: config
        });
      } else {
        await HomeConfig.create({
          config_key: selectedPage,
          config_data: config
        });
      }
      
      alert('השינויים נשמרו בהצלחה!');
    } catch (error) {
      console.error('Error saving config:', error);
      alert('שגיאה בשמירת השינויים');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type,
      enabled: true,
      title: type === 'articles' ? 'מקטע חדש' : type === 'slider' ? 'סליידר חדש' : 'מקטע חדש',
      ...(type === 'articles' || type === 'slider' ? {
        category: categories[0]?.slug || '',
        articleCount: 6,
        display: { showDate: true, showAuthor: true }
      } : {}),
      ...(type === 'ad' ? { position: 'main_leaderboard' } : {}),
      ...(type === 'adsense' ? { position: 'center-1' } : {}),
      ...(type === 'special_alert' ? { article_id: '' } : {})
    };

    setConfig({
      ...config,
      sections: [...(config.sections || []), newSection]
    });
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(config.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setConfig({ ...config, sections: items });
  };

  const isHomePage = selectedPage === 'homePage';

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">עורך דפים</h2>
          <p className="text-gray-600">עצב וארגן את תוכן הדפים באתר</p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-5 h-5 ml-2" />
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>בחר דף לעריכה</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isHomePage && (
        <Card>
          <CardHeader>
            <CardTitle>הגדרות Hero</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>הצג מקטע Hero</Label>
              <Switch
                checked={config.hero.enabled}
                onCheckedChange={(checked) => 
                  setConfig({ ...config, hero: { ...config.hero, enabled: checked } })
                }
              />
            </div>

            {config.hero.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <Label>הצג חדשות מבזקים</Label>
                  <Switch
                    checked={config.hero.showBreakingNews}
                    onCheckedChange={(checked) => 
                      setConfig({ ...config, hero: { ...config.hero, showBreakingNews: checked } })
                    }
                  />
                </div>

                <div>
                  <Label>מספר מאמרים ב-Hero</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config.hero.articleCount}
                    onChange={(e) => 
                      setConfig({ 
                        ...config, 
                        hero: { ...config.hero, articleCount: parseInt(e.target.value) } 
                      })
                    }
                  />
                </div>

                <div>
                  <Label>סגנון תצוגת Hero</Label>
                  <GridStyleSelector
                    value={config.hero.grid_style}
                    onChange={(value) => 
                      setConfig({ ...config, hero: { ...config.hero, grid_style: value } })
                    }
                  />
                </div>

                {config.hero.grid_style === 'kan-naim-original' && (
                  <div>
                    <Label>קישור למייל האדום</Label>
                    <Input
                      value={config.hero.redMailLink}
                      onChange={(e) => 
                        setConfig({ 
                          ...config, 
                          hero: { ...config.hero, redMailLink: e.target.value } 
                        })
                      }
                      placeholder="mailto:example@example.com"
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>מקטעי תוכן</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleAddSection('articles')}>
                <Plus className="w-4 h-4 ml-1" />
                מאמרים
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddSection('slider')}>
                <Plus className="w-4 h-4 ml-1" />
                סליידר
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleAddSection('ad')}>
                <Plus className="w-4 h-4 ml-1" />
                פרסומת
              </Button>
              {isHomePage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleAddSection('special_alert')}>
                    <Plus className="w-4 h-4 ml-1" />
                    התראה
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleAddSection('hot_articles')}>
                    <Plus className="w-4 h-4 ml-1" />
                    מאמרים חמים
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3"
                >
                  {config.sections.map((section, index) => (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <SectionEditor
                            section={section}
                            categories={categories}
                            articles={articles}
                            onChange={(updated) => {
                              const newSections = [...config.sections];
                              newSections[index] = updated;
                              setConfig({ ...config, sections: newSections });
                            }}
                            onRemove={() => {
                              const newSections = config.sections.filter((_, i) => i !== index);
                              setConfig({ ...config, sections: newSections });
                            }}
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

          {config.sections.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              אין מקטעים. לחץ על אחד הכפתורים למעלה להוספת מקטע חדש.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}