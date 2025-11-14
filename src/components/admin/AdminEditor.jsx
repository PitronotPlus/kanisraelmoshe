
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Article } from "@/entities/Article";
import { Category } from "@/entities/Category";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PenTool, Save, Eye, Upload, X, Settings, ImageIcon, ArrowLeft, Plus } from "lucide-react";
import { UploadFile } from "@/integrations/Core";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ImageEditor from "./ImageEditor";
import CategorySelector from "./CategorySelector";
import TableGenerator from "./TableGenerator";
import { createPageUrl } from "@/utils";

// Whitelist and register fonts with Quill
const Font = ReactQuill.Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'serif', 'monospace', 'assistant', 'heebo', 'arial'];
ReactQuill.Quill.register(Font, true);

// Size and other formatting options
const Size = ReactQuill.Quill.import('formats/size');
Size.whitelist = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '22px', '24px', '28px', '32px', '36px', '48px', '64px'];
ReactQuill.Quill.register(Size, true);

const quillModules = {
  toolbar: {
    container: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': Font.whitelist }],
      [{ 'size': Size.whitelist }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      [{ 'align': [] }],
      [{ 'direction': 'rtl' }], // Re-added RTL direction button
      ['link', 'image', 'video'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['clean'],
      ['code-block']
    ],
    handlers: {
      'image': function() {
        // Custom image handler will be set in the component
      }
    }
  }
};

const quillFormats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike', 'blockquote',
  'list', 'bullet', 'indent', 'align', 'direction', // Re-added direction
  'link', 'image', 'video', 'color', 'background', 'script',
  'code-block'
];

export default function AdminEditor({ editingArticle, onSaveComplete, onArticleChange, onBack }) {
  const navigate = useNavigate();
  const [article, setArticle] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    categories: { primary: '', secondary: [] },
    media_type: "image", // New field
    featured_image: "",
    featured_image_alt: "",
    featured_video_url: "", // New field
    video_thumbnail: "", // New field
    tags: [],
    is_featured: false,
    hide_featured_image: false,
    published: false,
    scheduled_publish_date: "",
    author_user_id: "",
    reading_time: 0,
    seo_title: "",
    seo_description: "",
    focus_keyword: "",
    text_direction: "rtl"
  });

  const [currentTag, setCurrentTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [currentArticleId, setCurrentArticleId] = useState(null);

  // Image Editor state variables
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [quillRef, setQuillRef] = useState(null);
  const [editImageUrl, setEditImageUrl] = useState('');

  // Table management state
  const [showTableGenerator, setShowTableGenerator] = useState(false);
  const [savedTables, setSavedTables] = useState([]);
  const [tableToEdit, setTableToEdit] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const [categoriesData, currentUser, usersData] = await Promise.all([
                Category.list(),
                User.me(),
                User.list()
            ]);
            setAllCategories(categoriesData);
            setUser(currentUser);
            setAllUsers(usersData.filter(u => u.status === 'approved' || u.role === 'admin'));

            if (editingArticle) {
                let categories = { primary: '', secondary: [] };
                if (editingArticle.category) {
                    const primaryCat = categoriesData.find(c => c.name === editingArticle.category);
                    if (primaryCat) {
                        categories.primary = primaryCat.slug;
                    }
                    if (editingArticle.subcategory) {
                        const secondaryCat = categoriesData.find(c => c.name === editingArticle.subcategory);
                        if (secondaryCat) {
                            categories.secondary = [secondaryCat.slug];
                        }
                    }
                }
                if (editingArticle.categories && editingArticle.categories.primary) {
                    categories = editingArticle.categories;
                }

                setArticle({
                    ...editingArticle,
                    tags: editingArticle.tags || [],
                    hide_featured_image: editingArticle.hide_featured_image || false,
                    author_user_id: editingArticle.author_user_id || "",
                    scheduled_publish_date: editingArticle.scheduled_publish_date || "",
                    categories: categories,
                    media_type: editingArticle.media_type || "image",
                    featured_video_url: editingArticle.featured_video_url || "",
                    video_thumbnail: editingArticle.video_thumbnail || ""
                });
                setCurrentArticleId(editingArticle.id);
            } else {
                setArticle(prev => ({
                    ...prev,
                    categories: { primary: '', secondary: [] },
                    author_user_id: currentUser?.id || "",
                    scheduled_publish_date: "",
                    title: "",
                    slug: "",
                    content: "",
                    excerpt: "",
                    media_type: "image",
                    featured_image: "",
                    featured_image_alt: "",
                    featured_video_url: "",
                    video_thumbnail: "",
                    tags: [],
                    is_featured: false,
                    hide_featured_image: false,
                    published: false,
                    reading_time: 0,
                    seo_title: "",
                    seo_description: "",
                    focus_keyword: "",
                    text_direction: "rtl"
                }));
                setCurrentArticleId(null);
                setCurrentTag("");
            }
        } catch(e) {
            console.error("Failed to load initial data for editor", e);
        }
    };
    loadInitialData();
  }, [editingArticle]);

  useEffect(() => {
    if (quillRef) {
      const toolbar = quillRef.getEditor().getModule('toolbar');
      toolbar.addHandler('image', imageHandler);
      
      // Set default direction to RTL
      const editor = quillRef.getEditor();
      editor.format('direction', 'rtl');
      editor.format('align', 'right'); // Also align to right for RTL
    }
  }, [quillRef]);

  // Load and save tables from/to localStorage
  useEffect(() => {
    if (currentArticleId) {
      const saved = localStorage.getItem(`article_tables_${currentArticleId}`);
      if (saved) {
        setSavedTables(JSON.parse(saved));
      } else {
        setSavedTables([]);
      }
    } else {
      setSavedTables([]);
    }
  }, [currentArticleId]);

  // Save tables to localStorage
  const saveTablesData = (tables) => {
    setSavedTables(tables);
    if (currentArticleId) {
      localStorage.setItem(`article_tables_${currentArticleId}`, JSON.stringify(tables));
    }
  };

  const handleInputChange = (field, value) => {
    setArticle(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoriesChange = (newCategories) => {
    setArticle(prev => ({
      ...prev,
      categories: newCategories
    }));
  };

  const handleAuthorUserChange = (userId) => {
    setArticle(prev => ({
      ...prev,
      author_user_id: userId === 'none' ? '' : userId,
    }));
  };
  
  const handleFeaturedImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const updatedArticle = {
        ...article,
        featured_image: file_url
      };
      setArticle(updatedArticle);
      if (onArticleChange) onArticleChange(updatedArticle);
    } catch (error) {
      console.error('Error uploading featured image:', error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleFeaturedImageUrlChange = (url) => {
    const updatedArticle = {
      ...article,
      featured_image: url
    };
    setArticle(updatedArticle);
    if (onArticleChange) onArticleChange(updatedArticle);
  };

  const handleQuillImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setCurrentImageUrl(file_url);
      setShowImageEditor(true);
    } catch (error) {
      console.error('Error uploading image for editor:', error);
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleImageSave = (htmlString, imageData) => {
    if (quillRef) {
      const editor = quillRef.getEditor();
      if (editor) {
        editor.focus();
        const range = editor.getSelection(true);
        const index = range ? range.index : editor.getLength();
        
        editor.clipboard.dangerouslyPasteHTML(index, htmlString, 'api');
        editor.setSelection(index + 1, 0); 
      }
    }
    
    setShowImageEditor(false);
    setCurrentImageUrl('');
    setEditImageUrl('');
  };

  const handleImageCancel = () => {
    setShowImageEditor(false);
    setCurrentImageUrl('');
    setEditImageUrl('');
  };

  const imageHandler = () => {
    document.getElementById('image-upload-quill')?.click();
  };

  const handleEditImageByUrl = () => {
    if (!editImageUrl.trim()) {
      alert('אנא הזן כתובת תמונה');
      return;
    }
    setCurrentImageUrl(editImageUrl);
    setShowImageEditor(true);
  };

  const addTag = () => {
    if (currentTag.trim() && !article.tags.includes(currentTag.trim())) {
      setArticle(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setArticle(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
    return Math.ceil(words / wordsPerMinute);
  };

  const handleSave = async (publishStatus, isPreview = false) => {
    setIsSaving(true);

    try {
      const readingTime = calculateReadingTime(article.content);
      
      const selectedUser = allUsers.find(u => u.id === article.author_user_id);
      const createdByEmail = selectedUser ? selectedUser.email : user?.email;
      
      let finalPublishStatus = publishStatus;
      if (article.scheduled_publish_date && !publishStatus) {
        const scheduledDate = new Date(article.scheduled_publish_date);
        const now = new Date();
        if (scheduledDate <= now) {
          finalPublishStatus = true;
        }
      }
      
      const articleData = {
        ...article,
        published: finalPublishStatus,
        reading_time: readingTime,
        created_by: createdByEmail,
        author: selectedUser ? (selectedUser.display_name || selectedUser.full_name) : (user?.full_name || 'מערכת')
      };

      let articleId = currentArticleId;

      if (!articleId) {
        const newArticle = await Article.create(articleData);
        articleId = newArticle.id;
        setCurrentArticleId(articleId);
        setArticle(prev => ({ ...prev, id: articleId }));
        if (onArticleChange) onArticleChange({ ...articleData, id: articleId });
      } else {
        await Article.update(articleId, articleData);
        if (onArticleChange) onArticleChange({ ...articleData, id: articleId });
      }
      
      if (isPreview) {
        if (articleId) {
          window.open(createPageUrl(`Article?id=${articleId}&preview=true`), '_blank');
        } else {
           alert('שגיאה: לא ניתן ליצור תצוגה מקדימה.');
        }
      } else {
        const message = article.scheduled_publish_date && !finalPublishStatus ? 
          'המאמר נשמר ומתוזמן לפרסום!' : 
          (finalPublishStatus ? 'המאמר עודכן ופורסם בהצלחה!' : 'השינויים נשמרו כטיוטה!');
        alert(message);
        if (onSaveComplete) {
          onSaveComplete();
        }
      }
    } catch (error) {
      console.error('Error saving article:', error);
      alert('שגיאה בשמירת המאמר');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const handleTableInsert = (shortcode) => {
    if (quillRef) {
      const editor = quillRef.getEditor();
      const range = editor.getSelection(true);
      editor.insertText(range.index, shortcode, 'user');
    }
  };

  const handleSaveTable = (tableData) => {
    const newTables = [...savedTables];
    const existingIndex = newTables.findIndex(t => t.id === tableData.id);
    
    if (existingIndex >= 0) {
      newTables[existingIndex] = tableData;
    } else {
      newTables.push(tableData);
    }
    
    saveTablesData(newTables);
  };

  const handleDeleteTable = (tableId) => {
    const newTables = savedTables.filter(t => t.id !== tableId);
    saveTablesData(newTables);
  };

  const handleEditTable = (tableData) => {
    setTableToEdit(tableData);
    setShowTableGenerator(true);
  };

  return (
    <div className="space-y-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap');
        .ql-font-assistant { font-family: 'Assistant', sans-serif; }
        .ql-font-arial { font-family: 'Arial', sans-serif; }
        .ql-font-heebo { font-family: 'Heebo', sans-serif; }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="assistant"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="assistant"]::before {
          content: 'Assistant';
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="heebo"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="heebo"]::before {
          content: 'Heebo';
        }
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before {
          content: 'Arial';
        }
        
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="8px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="8px"]::before { content: '8px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="10px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before { content: '10px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="12px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before { content: '12px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="14px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before { content: '14px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="16px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before { content: '16px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="18px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before { content: '18px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="20px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before { content: '20px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="22px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="22px"]::before { content: '22px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="24px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before { content: '24px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="28px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="28px"]::before { content: '28px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="32px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="32px"]::before { content: '32px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="36px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="36px"]::before { content: '36px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="48px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="48px"]::before { content: '48px'; }
        .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="64px"]::before,
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="64px"]::before { content: '64px'; }
        
        .admin-quill .ql-editor {
          min-height: 600px;
          font-size: 16px;
          direction: rtl; /* Default RTL direction */
          text-align: right; /* Default right alignment for RTL */
        }

        .admin-quill .ql-toolbar {
          direction: ltr;
        }

        /* RTL-specific styles for better text editing experience */
        .admin-quill .ql-editor p {
          direction: rtl;
          text-align: right;
        }

        .admin-quill .ql-editor h1,
        .admin-quill .ql-editor h2,
        .admin-quill .ql-editor h3,
        .admin-quill .ql-editor h4,
        .admin-quill .ql-editor h5,
        .admin-quill .ql-editor h6 {
          direction: rtl;
          text-align: right;
        }

        .admin-quill .ql-editor ul,
        .admin-quill .ql-editor ol {
          direction: rtl;
          text-align: right;
        }

        .admin-quill .ql-editor blockquote {
          direction: rtl;
          text-align: right;
          border-right: 4px solid #ccc;
          border-left: none;
          padding-right: 16px;
          padding-left: 0;
        }
      `}</style>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-blue-100 p-3 rounded-xl">
            <PenTool className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {editingArticle ? 'עריכת מאמר' : 'עורך הכתבות'}
            </h2>
            <p className="text-gray-600">
              {editingArticle ? 'ערוך את המאמר הקיים' : 'צור וערוך כתבות חדשות עם כלים מקצועיים'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>תוכן הכתבה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">כותרת הכתבה</Label>
                <Input
                  id="title"
                  value={article.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="כותרת מושכת ומעניינת..."
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">קישור (Slug)</Label>
                <Input
                  id="slug"
                  value={article.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  placeholder="my-awesome-article"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              {/* Table Generator Button */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTableToEdit(null); // Ensure we open in "new table" mode
                    setShowTableGenerator(true);
                  }}
                  className="text-purple-600 border-purple-300 hover:bg-purple-50"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף / ערוך טבלה
                </Button>
              </div>

              <div className="space-y-2">
                <Label>תוכן הכתבה</Label>
                <div className="border rounded-lg bg-white">
                  <ReactQuill
                    ref={setQuillRef}
                    value={article.content}
                    onChange={(value) => handleInputChange('content', value)}
                    theme="snow"
                    modules={quillModules}
                    formats={quillFormats}
                    className="admin-quill"
                    placeholder="כתוב את הכתבה כאן..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>עריכת תמונה קיימת</Label>
                <div className="flex gap-2">
                  <Input
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="הדבק כאן כתובת תמונה לעריכה..."
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleEditImageByUrl}
                    disabled={!editImageUrl.trim()}
                  >
                    <ImageIcon className="w-4 h-4 ml-2" />
                    ערוך תמונה
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  כדי לערוך תמונה שכבר קיימת במאמר, העתק את כתובת התמונה והדבק אותה כאן
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleQuillImageUpload}
                className="hidden"
                id="image-upload-quill"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>פרסום</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-3">
                 <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 ml-2" />
                  שמור כטיוטה
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSave(article.published, true)}
                  disabled={isSaving}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  תצוגה מקדימה
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      מעבד...
                    </>
                  ) : (
                    'פרסם כתבה'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>הגדרות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>כתבה מובילה</Label>
                <Switch
                  checked={article.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="hide_featured_image">הסתר תמונה ראשית במאמר</Label>
                <Switch
                  id="hide_featured_image"
                  checked={article.hide_featured_image}
                  onCheckedChange={(checked) => handleInputChange('hide_featured_image', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_publish_date">תזמון פרסום</Label>
                <Input
                  id="scheduled_publish_date"
                  type="datetime-local"
                  value={article.scheduled_publish_date}
                  onChange={(e) => handleInputChange('scheduled_publish_date', e.target.value)}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  השאר ריק לפרסום מיידי. אם תגדיר תאריך, המאמר יפורסם אוטומטית באותו מועד.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">תקציר</Label>
                <Textarea
                  id="excerpt"
                  value={article.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="תקציר קצר של הכתבה..."
                  className="h-24"
                />
              </div>
              <div className="space-y-2">
                <Label>בחר כותב המאמר</Label>
                <Select value={article.author_user_id || 'none'} onValueChange={handleAuthorUserChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר משתמש" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">ללא משתמש מקושר</SelectItem>
                    {allUsers.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.display_name || u.full_name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  שם הכותב יעודכן אוטומטית לפי הבחירה במשתמש המקושר
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>מדיה ראשית</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>סוג מדיה</Label>
                <Select 
                  value={article.media_type || 'image'} 
                  onValueChange={(value) => handleInputChange('media_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">תמונה ראשית</SelectItem>
                    <SelectItem value="video">וידאו ראשי</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {article.media_type === 'video' ? (
                <>
                  {/* Video Section */}
                  <div className="space-y-2">
                    <Label htmlFor="featured_video_url">קישור לוידאו</Label>
                    <Input
                      id="featured_video_url"
                      value={article.featured_video_url || ''}
                      onChange={(e) => handleInputChange('featured_video_url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      תומך ב-YouTube, Vimeo ועוד פלטפורמות וידאו
                    </p>
                  </div>

                  {article.featured_video_url && (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <iframe
                        src={article.featured_video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        title="תצוגה מקדימה של וידאו"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="video_thumbnail">תמונת תצוגה מקדימה</Label>
                    <Input
                      id="video_thumbnail"
                      value={article.video_thumbnail || ''}
                      onChange={(e) => handleInputChange('video_thumbnail', e.target.value)}
                      placeholder="https://example.com/thumbnail.jpg"
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      תמונה שתוצג ברשימת המאמרים (אופציונלי)
                    </p>
                  </div>

                  {article.video_thumbnail && (
                    <img
                      src={article.video_thumbnail}
                      alt="תמונת תצוגה מקדימה לוידאו"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </>
              ) : (
                <>
                  {/* Image Section - existing code */}
                  {article.featured_image && (
                    <img
                      src={article.featured_image}
                      alt={article.featured_image_alt || "תמונה ראשית"}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="featured_image_url">קישור לתמונה</Label>
                    <Input
                      id="featured_image_url"
                      value={article.featured_image || ''}
                      onChange={(e) => handleFeaturedImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFeaturedImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={isUploading}
                      className="w-full"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                          מעלה...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 ml-2" />
                          העלה תמונה
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featured_image_alt">טקסט חלופי (Alt)</Label>
                    <Input
                      id="featured_image_alt"
                      value={article.featured_image_alt}
                      onChange={(e) => handleInputChange('featured_image_alt', e.target.value)}
                      placeholder="תיאור תמונה לנגישות ו-SEO"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>קטגוריות ותגיות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CategorySelector
                allCategories={allCategories}
                selected={article.categories}
                onChange={handleCategoriesChange}
              />

              <div className="space-y-2">
                <Label>תגיות</Label>
                <div className="flex space-x-2 space-x-reverse">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="הוסף תגית ולחץ אנטר"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1 space-x-reverse">
                      <span>{tag}</span>
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse"><Settings className="w-5 h-5"/><span>הגדרות SEO</span></CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo_title">כותרת SEO</Label>
                <Input
                  id="seo_title"
                  value={article.seo_title}
                  onChange={(e) => handleInputChange('seo_title', e.target.value)}
                  placeholder="כותרת מותאמת לגוגל"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo_description">תיאור מטא (Meta Description)</Label>
                <Textarea
                  id="seo_description"
                  value={article.seo_description}
                  onChange={(e) => handleInputChange('seo_description', e.target.value)}
                  placeholder="תיאור קצר למנועי חיפוש (עד 160 תווים)"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="focus_keyword">מילת מפתח</Label>
                <Input
                  id="focus_keyword"
                  value={article.focus_keyword}
                  onChange={(e) => handleInputChange('focus_keyword', e.target.value)}
                  placeholder="מילת המפתח המרכזית של המאמר"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showImageEditor && (
        <ImageEditor
          imageUrl={currentImageUrl}
          onSave={handleImageSave}
          onCancel={handleImageCancel}
        />
      )}

      {/* Table Generator Modal */}
      <TableGenerator
        isOpen={showTableGenerator}
        onClose={() => {
            setShowTableGenerator(false);
            setTableToEdit(null); // Clear tableToEdit when closing
        }}
        onInsert={handleTableInsert}
        savedTables={savedTables}
        onSaveTable={handleSaveTable}
        onDeleteTable={handleDeleteTable}
        onEditTable={handleEditTable}
        tableToEdit={tableToEdit}
      />
    </div>
  );
}
