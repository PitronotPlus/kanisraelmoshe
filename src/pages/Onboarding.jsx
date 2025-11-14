
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Clock, XCircle, UserCheck } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Onboarding() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileData, setProfileData] = useState({
    requested_app_role: "",
    phone: "",
    company: "",
    bio: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error)
      {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);
  
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileData.requested_app_role || !profileData.phone) {
      alert("אנא מלא את כל שדות החובה (*).");
      return;
    }
    setIsSubmitting(true);
    try {
      const dataToUpdate = { ...profileData, status: 'pending' };
      await User.updateMyUserData(dataToUpdate);
      const updatedUser = await User.me();
      setUser(updatedUser);
    } catch (error) {
      alert('שגיאה בשליחת הפרטים: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">טוען נתונים...</p>
        </div>
      );
  }

  // Add a special case for admin users
  if (user && user.role === 'admin') {
    return (
      <Card className="text-center shadow-lg max-w-md mx-auto">
          <CardHeader>
              <CheckCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <CardTitle>שלום, אדמין!</CardTitle>
          </CardHeader>
          <CardContent>
              <p className="text-gray-600">אין צורך בתהליך קליטה עבור מנהל. יש לך גישה מלאה.</p>
              <Button onClick={() => navigate(createPageUrl('Admin'))} className="mt-4">עבור לפאנל הניהול</Button>
          </CardContent>
      </Card>
    );
  }

  if (!user) {
     return (
        <div className="max-w-md mx-auto py-12">
            <Card className="text-center">
                 <CardHeader>
                    <CardTitle>לא מחובר</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <p>עליך להתחבר או להירשם כדי לגשת לעמוד זה.</p>
                    <div className="flex justify-center gap-4">
                        <Button onClick={() => User.login()}>כניסה / הרשמה</Button>
                    </div>
                 </CardContent>
            </Card>
        </div>
     )
  }

    if (user.status === 'approved') {
      return (
        <Card className="text-center shadow-lg max-w-md mx-auto">
            <CardHeader>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle>החשבון שלך מאושר!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-600">כל האפשרויות פתוחות בפניך. ברוך הבא!</p>
                <Button onClick={() => navigate(createPageUrl('Home'))} className="mt-4">חזרה לדף הבית</Button>
            </CardContent>
        </Card>
      );
    }

    if (user.status === 'rejected') {
        return (
            <Card className="text-center shadow-lg max-w-md mx-auto">
                <CardHeader>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <CardTitle>סטטוס בקשה</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">מצטערים, לאחר בדיקה, בקשתך לא אושרה.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (user.requested_app_role) {
         return (
            <Card className="text-center shadow-lg max-w-md mx-auto">
                <CardHeader>
                    <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                    <CardTitle>בקשתך בבדיקה</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">תודה שהגשת את פרטיך. אנו נבדוק את הבקשה ונעדכן אותך במייל.</p>
                </CardContent>
            </Card>
        );
    }

    return (
      <Card className="shadow-lg max-w-2xl mx-auto">
        <CardHeader>
            <div className="flex items-center space-x-4 space-x-reverse mb-2">
                <UserCheck className="w-10 h-10 text-blue-600"/>
                <div>
                    <CardTitle>השלמת פרטים</CardTitle>
                    <CardDescription>שלום {user.display_name || user.full_name}, אנא מלא את הפרטים הבאים כדי שנאשר את חשבונך.</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <Label htmlFor="email">כתובת אימייל</Label>
                <Input id="email" type="email" value={user.email} disabled />
              </div>
               <div className="space-y-2">
                <Label htmlFor="phone">מספר טלפון *</Label>
                <Input id="phone" value={profileData.phone} onChange={(e) => handleProfileChange('phone', e.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>סוג החשבון המבוקש *</Label>
                <Select value={profileData.requested_app_role} onValueChange={(value) => handleProfileChange('requested_app_role', value)}>
                  <SelectTrigger><SelectValue placeholder="בחר סוג חשבון" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertiser">מפרסם</SelectItem>
                    <SelectItem value="speaker">דובר/כותב</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {profileData.requested_app_role === 'advertiser' && (
              <div className="space-y-2">
                <Label htmlFor="company">שם החברה</Label>
                <Input id="company" value={profileData.company} onChange={(e) => handleProfileChange('company', e.target.value)} />
              </div>
            )}

            {profileData.requested_app_role === 'speaker' && (
              <div className="space-y-2">
                <Label htmlFor="bio">תיאור אישי</Label>
                <Textarea id="bio" value={profileData.bio} onChange={(e) => handleProfileChange('bio', e.target.value)} placeholder="ספר על עצמך ועל הניסיון שלך..." rows={4} />
              </div>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'שולח פרטים...' : 'שלח בקשה לאישור'}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
}
