import React, { useState, useEffect } from 'react';
import { Advertisement } from '@/entities/Advertisement';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Image, Code, Video, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const BannerForm = ({ banner, onSave, onCancel }) => {
  const [formData, setFormData] = useState(banner || {
    title: '',
    content_type: 'video',
    position: 'header',
    size: 'banner',
    active: true,
    image_url: '',
    html_code: '',
    video_url: '',
    link_url: '',
    advertiser_name: '',
    advertiser_email: '',
    start_date: '',
    end_date: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{banner ? 'עריכת באנר' : 'הוספת באנר חדש'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>כותרת</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <Label>סוג תוכן</Label>
              <Select
                value={formData.content_type}
                onValueChange={(value) => setFormData({...formData, content_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">וידאו (ברירת מחדל)</SelectItem>
                  <SelectItem value="image">תמונה</SelectItem>
                  <SelectItem value="html">קוד HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>מיקום</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({...formData, position: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">באנר עליון</SelectItem>
                  <SelectItem value="header_side">באנר צד (ליד לוגו)</SelectItem>
                  <SelectItem value="sidebar_top">סרגל צד - עליון</SelectItem>
                  <SelectItem value="sidebar_bottom">סרגל צד - תחתון</SelectItem>
                  <SelectItem value="main_leaderboard">באנר ראשי</SelectItem>
                  <SelectItem value="main_leaderboard_right">מודעות ראשי - ימין (65% - גדול)</SelectItem>
                  <SelectItem value="main_leaderboard_left">מודעות ראשי - שמאל (35% - קטן)</SelectItem>
                  <SelectItem value="between_articles">בין מאמרים</SelectItem>
                  <SelectItem value="large_banner">באנר גדול</SelectItem>
                  <SelectItem value="footer">באנר תחתון</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>גודל</Label>
              <Select
                value={formData.size}
                onValueChange={(value) => setFormData({...formData, size: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">באנר (728x90)</SelectItem>
                  <SelectItem value="header">כותרת (300x60)</SelectItem>
                  <SelectItem value="square">ריבוע (250x250)</SelectItem>
                  <SelectItem value="rectangle">מלבן (300x250)</SelectItem>
                  <SelectItem value="large">גדול (970x250)</SelectItem>
                  <SelectItem value="mobile">מובייל (320x50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Content based on type */}
          {formData.content_type === 'image' && (
            <div>
              <Label>קישור לתמונה</Label>
              <Input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          )}

          {formData.content_type === 'html' && (
            <div>
              <Label>קוד HTML</Label>
              <Textarea
                value={formData.html_code}
                onChange={(e) => setFormData({...formData, html_code: e.target.value})}
                placeholder="<div>...</div>"
                rows={6}
                className="font-mono text-sm"
              />
            </div>
          )}

          {formData.content_type === 'video' && (
            <div>
              <Label>קישור לוידאו (אופציונלי - אם ריק יוצג הוידאו ברירת המחדל)</Label>
              <Input
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                placeholder="https://example.com/video.mp4"
              />
            </div>
          )}

          {(formData.content_type === 'image' || formData.content_type === 'video') && (
            <div>
              <Label>קישור ליעד (בלחיצה)</Label>
              <Input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                placeholder="https://example.com"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם מפרסם</Label>
              <Input
                value={formData.advertiser_name}
                onChange={(e) => setFormData({...formData, advertiser_name: e.target.value})}
              />
            </div>

            <div>
              <Label>אימייל מפרסם</Label>
              <Input
                type="email"
                value={formData.advertiser_email}
                onChange={(e) => setFormData({...formData, advertiser_email: e.target.value})}
              />
            </div>

            <div>
              <Label>תאריך התחלה</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              />
            </div>

            <div>
              <Label>תאריך סיום</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({...formData, active: checked})}
            />
            <Label>באנר פעיל</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">שמור</Button>
            <Button type="button" variant="outline" onClick={onCancel}>ביטול</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const BannerItem = ({ banner, onEdit, onDelete, onToggle }) => {
  const getContentIcon = () => {
    switch (banner.content_type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'html': return <Code className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getPositionLabel = (position) => {
    const labels = {
      'header': 'באנר עליון',
      'header_side': 'באנר צד',
      'sidebar_top': 'סרגל צד - עליון',
      'sidebar_bottom': 'סרגל צד - תחתון',
      'main_leaderboard': 'באנר ראשי',
      'main_leaderboard_right': 'מודעות ראשי - ימין (65% - גדול)',
      'main_leaderboard_left': 'מודעות ראשי - שמאל (35% - קטן)',
      'between_articles': 'בין מאמרים',
      'large_banner': 'באנר גדול',
      'footer': 'באנר תחתון'
    };
    return labels[position] || position;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getContentIcon()}
              <h3 className="font-semibold text-lg">{banner.title}</h3>
              <Badge variant={banner.active ? 'default' : 'secondary'}>
                {banner.active ? 'פעיל' : 'לא פעיל'}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>מיקום:</strong> {getPositionLabel(banner.position)}</p>
              <p><strong>גודל:</strong> {banner.size}</p>
              {banner.advertiser_name && (
                <p><strong>מפרסם:</strong> {banner.advertiser_name}</p>
              )}
              {banner.start_date && (
                <p><strong>תאריך התחלה:</strong> {format(new Date(banner.start_date), 'dd/MM/yyyy', { locale: he })}</p>
              )}
              {banner.end_date && (
                <p><strong>תאריך סיום:</strong> {format(new Date(banner.end_date), 'dd/MM/yyyy', { locale: he })}</p>
              )}
              {banner.link_url && (
                <p className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {banner.link_url.substring(0, 50)}...
                  </a>
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onToggle(banner)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(banner)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(banner.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await Advertisement.list('-created_date');
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (bannerData) => {
    try {
      if (editingBanner) {
        await Advertisement.update(editingBanner.id, bannerData);
      } else {
        await Advertisement.create(bannerData);
      }
      await loadBanners();
      setShowForm(false);
      setEditingBanner(null);
    } catch (error) {
      console.error('Error saving banner:', error);
      alert('שגיאה בשמירת הבאנר');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הבאנר?')) {
      try {
        await Advertisement.delete(id);
        await loadBanners();
      } catch (error) {
        console.error('Error deleting banner:', error);
        alert('שגיאה במחיקת הבאנר');
      }
    }
  };

  const handleToggle = async (banner) => {
    try {
      await Advertisement.update(banner.id, { active: !banner.active });
      await loadBanners();
    } catch (error) {
      console.error('Error toggling banner:', error);
      alert('שגיאה בעדכון הבאנר');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBanner(null);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>טוען באנרים...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניהול באנרים ופרסומות</h2>
          <p className="text-gray-600">נהל את הבאנרים והפרסומות באתר</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 ml-2" />
          הוסף באנר חדש
        </Button>
      </div>

      {showForm && (
        <BannerForm
          banner={editingBanner}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <div className="grid grid-cols-1 gap-4">
        {banners.map((banner) => (
          <BannerItem
            key={banner.id}
            banner={banner}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {banners.length === 0 && !showForm && (
        <Card>
          <CardContent className="p-8 text-center">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">אין באנרים עדיין</h3>
            <p className="text-gray-600 mb-4">הוסף באנר ראשון כדי להתחיל</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף באנר
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}