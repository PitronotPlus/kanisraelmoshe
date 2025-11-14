
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { UploadFile } from "@/integrations/Core";

export default function AdForm({ ad, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    link_url: "",
    position: "sidebar_top", // Updated default position
    size: "square",
    active: true,
    start_date: "",
    end_date: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (ad) {
      // Map old 'sidebar' position to 'sidebar_top' for display
      let effectivePosition = ad.position;
      if (ad.position === "sidebar") {
        effectivePosition = "sidebar_top";
      }

      setFormData({
        title: ad.title || "",
        image_url: ad.image_url || "",
        link_url: ad.link_url || "",
        position: effectivePosition || "sidebar_top", // Ensure a valid default
        size: ad.size || "square",
        active: ad.active !== undefined ? ad.active : true,
        start_date: ad.start_date ? ad.start_date.split('T')[0] : "",
        end_date: ad.end_date ? ad.end_date.split('T')[0] : "",
      });
    }
  }, [ad]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('image_url', file_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{ad ? "עריכת מודעה" : "יצירת מודעה חדשה"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת המודעה</Label>
              <Input id="title" value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_url">קישור (URL)</Label>
              <Input id="link_url" type="url" value={formData.link_url} onChange={(e) => handleInputChange('link_url', e.target.value)} required />
            </div>
          </div>
          
          <div>
            <Label>תמונת באנר</Label>
            {formData.image_url && <img src={formData.image_url} alt="תצוגה מקדימה" className="w-full h-32 object-contain my-2 border rounded-lg p-2" />}
            <input type="file" id="image-upload" className="hidden" onChange={handleImageUpload} accept="image/*" />
            <Button type="button" variant="outline" className="w-full" onClick={() => document.getElementById('image-upload').click()} disabled={isUploading}>
              <Upload className="w-4 h-4 ml-2" />
              {isUploading ? "מעלה תמונה..." : "העלה תמונה"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>מיקום</Label>
              <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">כותרת עליונה</SelectItem>
                  <SelectItem value="sidebar_top">סרגל צד (עליון)</SelectItem>
                  <SelectItem value="sidebar_bottom">סרגל צד (תחתון)</SelectItem>
                  <SelectItem value="main_leaderboard">באנר ראשי</SelectItem>
                  <SelectItem value="between_articles">בין כתבות</SelectItem>
                  <SelectItem value="large_banner">באנר תחתון גדול</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>גודל</Label>
               <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">באנר (728x90)</SelectItem>
                  <SelectItem value="square">ריבוע (300x250)</SelectItem>
                  <SelectItem value="rectangle">מלבן (300x600)</SelectItem>
                  <SelectItem value="mobile">מובייל (320x50)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start_date">תאריך התחלה</Label>
              <Input id="start_date" type="date" value={formData.start_date} onChange={(e) => handleInputChange('start_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">תאריך סיום</Label>
              <Input id="end_date" type="date" value={formData.end_date} onChange={(e) => handleInputChange('end_date', e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
                <Switch id="active" checked={formData.active} onCheckedChange={(checked) => handleInputChange('active', checked)} />
                <Label htmlFor="active">הפעל קמפיין</Label>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onCancel}>ביטול</Button>
              <Button type="submit">{ad ? "שמור שינויים" : "צור מודעה"}</Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
