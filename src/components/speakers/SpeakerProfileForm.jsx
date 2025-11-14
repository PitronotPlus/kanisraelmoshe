
import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SpeakerProfileForm({ user, onSaveSuccess }) {
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    company: '', // Added company field
    bio: '',
    profile_image_url: ''
  });
  const [saving, setSaving] = useState(false); // Renamed from isSubmitting
  const [message, setMessage] = useState(''); // Added message state

  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        company: user.company || '', // Initialize company from user data
        bio: user.bio || '',
        profile_image_url: user.profile_image_url || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(''); // Clear previous message
    try {
      const updatedData = await User.updateMyUserData(profileData);
      // The SDK might return the full user object or just the updated data.
      // To be safe, we merge the response with existing form data.
      const updatedUser = { ...user, ...profileData, ...updatedData };
      setMessage('השינויים נשמרו בהצלחה!');
      if (onSaveSuccess) {
        onSaveSuccess(updatedUser);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('שגיאה בעדכון הפרופיל. אנא נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>עדכון פרטי הפרופיל שלי</CardTitle>
        {/* CardDescription is removed as per outline */}
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">שם מלא</Label>
              <Input
                id="full_name"
                value={profileData.full_name}
                onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={profileData.phone || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">חברה/ארגון</Label>
            <Input
              id="company"
              value={profileData.company || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="החברה או הארגון שלך"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">ביוגרפיה מקצועית</Label>
            <Textarea
              id="bio"
              value={profileData.bio || ''}
              onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="כתוב על עצמך, ההשכלה שלך, הניסיון המקצועי וכו'"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_image_url">תמונת פרופיל</Label>
            <div className="space-y-2">
              <Input
                id="profile_image_url"
                value={profileData.profile_image_url || ''}
                onChange={(e) => setProfileData(prev => ({ ...prev, profile_image_url: e.target.value }))}
                placeholder="הדבק קישור לתמונת פרופיל"
              />
              {profileData.profile_image_url && (
                <img
                  src={profileData.profile_image_url}
                  alt="תצוגה מקדימה"
                  className="w-32 h-32 object-cover rounded-full border-2 border-gray-300"
                />
              )}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                שומר...
              </>
            ) : (
              'שמור שינויים'
            )}
          </Button>
        </form>

        {message && (
          <div className={`p-3 rounded-lg text-center ${message.includes('נשמרו') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
