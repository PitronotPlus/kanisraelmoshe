
import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UserProfileEditor({ user, onSave, onCancel }) {
  const [editData, setEditData] = useState({
    full_name: '', // This will be read-only
    display_name: '',
    email: '',
    phone: '',
    company: '',
    bio: '',
    profile_image_url: '',
    app_role: '',
    status: 'pending',
    social_links: {}, // Added social_links
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (user) {
      setEditData({
        full_name: user.full_name || '',
        display_name: user.display_name || user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        bio: user.bio || '',
        profile_image_url: user.profile_image_url || '',
        app_role: user.app_role || '',
        status: user.status || 'pending',
        social_links: user.social_links || {} // Initialize social_links
      });
    } else {
      // Reset for new user
      setEditData({
        full_name: '',
        display_name: '',
        email: '',
        phone: '',
        company: '',
        bio: '',
        profile_image_url: '',
        app_role: '',
        status: 'pending',
        social_links: {} // Reset social_links for new user
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    if (field.startsWith('social_')) {
        const network = field.split('_')[1];
        setEditData(prev => ({
            ...prev,
            social_links: {
                ...(prev.social_links || {}), // Ensure social_links exists
                [network]: value
            }
        }));
    } else {
        setEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const dataToSave = { ...editData };
      // Do not save full_name or email as they are not editable
      delete dataToSave.full_name;
      delete dataToSave.email;

      let updatedUser;
      if (user?.id) {
        updatedUser = await User.update(user.id, dataToSave);
      } else {
        // This part is for creating a new user, which is not fully implemented for auth reasons
        // But we keep the logic here for completeness.
        // A proper "invite" flow would be needed.
        // For now, let's assume this editor is only for existing users.
        alert("לא ניתן ליצור משתמש חדש מכאן, יש להזמין אותו.");
        setIsSaving(false);
        return;
      }
      
      onSave(updatedUser);
      setSaveMessage('המשתמש עודכן בהצלחה!');
    } catch (error) {
      console.error('Failed to save user:', error);
      setSaveMessage('שגיאה בעדכון המשתמש.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50 mb-6">
      <CardHeader>
        <CardTitle className="text-blue-800">
          {user ? `עריכת משתמש - ${user.full_name}` : 'הוספת משתמש חדש'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">שם לתצוגה</Label>
            <Input
              id="display_name"
              value={editData.display_name}
              onChange={(e) => handleInputChange('display_name', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name">שם חשבון (מגוגל)</Label>
            <Input
              id="full_name"
              value={editData.full_name}
              disabled
            />
            <p className="text-xs text-gray-500">לא ניתן לעריכה. מסתנכרן מחשבון גוגל.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={editData.email}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">טלפון</Label>
            <Input
              id="phone"
              value={editData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">חברה</Label>
            <Input
              id="company"
              value={editData.company || ''}
              onChange={(e) => handleInputChange('company', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="app_role">תפקיד באפליקציה</Label>
            <Select value={editData.app_role || ''} onValueChange={(value) => handleInputChange('app_role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תפקיד" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">עורך</SelectItem>
                <SelectItem value="advertiser">מפרסם</SelectItem>
                <SelectItem value="speaker">דובר/כותב</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">סטטוס</Label>
            <Select value={editData.status || 'pending'} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="approved">מאושר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">תיאור אישי</Label>
          <Textarea
            id="bio"
            value={editData.bio || ''}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            rows={3}
            placeholder="תיאור קצר על המשתמש..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile_image_url">תמונת פרופיל (קישור)</Label>
          <Input
            id="profile_image_url"
            value={editData.profile_image_url || ''}
            onChange={(e) => handleInputChange('profile_image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">רשתות חברתיות</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              <Input value={editData.social_links?.linkedin || ''} onChange={(e) => handleInputChange('social_linkedin', e.target.value)} placeholder="קישור ל-LinkedIn" />
              <Input value={editData.social_links?.twitter || ''} onChange={(e) => handleInputChange('social_twitter', e.target.value)} placeholder="קישור ל-Twitter / X" />
              <Input value={editData.social_links?.facebook || ''} onChange={(e) => handleInputChange('social_facebook', e.target.value)} placeholder="קישור ל-Facebook" />
              <Input value={editData.social_links?.instagram || ''} onChange={(e) => handleInputChange('social_instagram', e.target.value)} placeholder="קישור ל-Instagram" />
              <Input value={editData.social_links?.youtube || ''} onChange={(e) => handleInputChange('social_youtube', e.target.value)} placeholder="קישור לערוץ YouTube" />
              <Input value={editData.social_links?.website || ''} onChange={(e) => handleInputChange('social_website', e.target.value)} placeholder="קישור לאתר אישי" />
          </div>
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                שומר...
              </>
            ) : (
              user ? 'עדכן משתמש' : 'צור משתמש'
            )}
          </Button>
        </div>

        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm ${saveMessage.includes('בהצלחה') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {saveMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
