
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Settings, Save, User as UserIcon, Linkedin, Twitter, Facebook, Instagram, Youtube, Globe } from "lucide-react";
import { UploadFile } from "@/integrations/Core";

export default function UserSettings() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setFormData({
        full_name: currentUser.full_name || "",
        bio: currentUser.bio || "",
        profile_image_url: currentUser.profile_image_url || "",
        phone: currentUser.phone || "",
        company: currentUser.company || "",
        social_links: currentUser.social_links || {}
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage("שגיאה בטעינת פרטי המשתמש");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('social_')) {
        const network = field.split('_')[1];
        setFormData(prev => ({
            ...prev,
            social_links: {
                ...prev.social_links,
                [network]: value
            }
        }));
    } else {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleInputChange('profile_image_url', file_url);
      setMessage("תמונה הועלתה בהצלחה");
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage("שגיאה בהעלאת התמונה");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await User.updateMyUserData(formData);
      setMessage("הפרטים עודכנו בהצלחה!");
      
      // רענן את נתוני המשתמש
      setTimeout(loadUserData, 1000);
    } catch (error) {
      console.error('Error updating user data:', error);
      setMessage("שגיאה בעדכון הפרטים");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>טוען פרטי משתמש...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">יש להתחבר כדי לראות עמוד זה</h3>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = formData.full_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center mb-8">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Settings className="w-8 h-8 text-blue-600" />
        </div>
        <div className="mr-4">
          <h1 className="text-3xl font-bold text-gray-900">הגדרות פרופיל</h1>
          <p className="text-gray-600">עדכן את פרטיך האישיים</p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>פרטי הפרופיל שלי</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* תמונת פרופיל */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                {formData.profile_image_url && (
                  <AvatarImage src={formData.profile_image_url} alt={formData.full_name} />
                )}
                <AvatarFallback className="text-2xl font-bold bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'מעלה...' : 'שנה תמונת פרופיל'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">שם מלא</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">מספר טלפון</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="054-1234567"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="company">חברה/ארגון</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="שם החברה או הארגון שלך"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">תיאור אישי</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                placeholder="כתוב מעט על עצמך - זה יופיע בתחתית המאמרים שלך..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_image_url">קישור לתמונת פרופיל (אלטרנטיבי)</Label>
              <Input
                id="profile_image_url"
                value={formData.profile_image_url}
                onChange={(e) => handleInputChange('profile_image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
                <Label className="text-lg font-semibold">רשתות חברתיות</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <Linkedin className="w-5 h-5 text-gray-500" />
                        <Input value={formData.social_links?.linkedin || ''} onChange={(e) => handleInputChange('social_linkedin', e.target.value)} placeholder="קישור ל-LinkedIn" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Twitter className="w-5 h-5 text-gray-500" />
                        <Input value={formData.social_links?.twitter || ''} onChange={(e) => handleInputChange('social_twitter', e.target.value)} placeholder="קישור ל-Twitter / X" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Facebook className="w-5 h-5 text-gray-500" />
                        <Input value={formData.social_links?.facebook || ''} onChange={(e) => handleInputChange('social_facebook', e.target.value)} placeholder="קישור ל-Facebook" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Instagram className="w-5 h-5 text-gray-500" />
                        <Input value={formData.social_links?.instagram || ''} onChange={(e) => handleInputChange('social_instagram', e.target.value)} placeholder="קישור ל-Instagram" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Youtube className="w-5 h-5 text-gray-500" />
                        <Input value={formData.social_links?.youtube || ''} onChange={(e) => handleInputChange('social_youtube', e.target.value)} placeholder="קישור לערוץ YouTube" />
                    </div>
                     <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-gray-500" />
                        <Input value={formData.social_links?.website || ''} onChange={(e) => handleInputChange('social_website', e.target.value)} placeholder="קישור לאתר אישי" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 ml-2" />
                    שמור שינויים
                  </>
                )}
              </Button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg text-sm ${
                message.includes('בהצלחה') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
