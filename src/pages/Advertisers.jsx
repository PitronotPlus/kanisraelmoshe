import { useState, useEffect } from "react";
import { Advertisement } from "@/entities/Advertisement";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Eye, MousePointer, DollarSign, ShieldX } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AdForm from "../components/advertisers/AdForm";
import AdList from "../components/advertisers/AdList";

export default function Advertisers() {
  const [user, setUser] = useState(null);
  const [ads, setAds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogin = async () => {
    try {
      await User.loginWithRedirect(window.location.href);
    } catch (e) {
      console.error("Login process was cancelled or failed:", e);
    }
  };
  
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const currentUser = await User.me();
        
        // If user is logged in, they are authorized
        if (currentUser) {
          setUser(currentUser);
          setIsAuthorized(true);
          await loadAds(currentUser.email);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        // User is not logged in
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const loadAds = async (userEmail) => {
    try {
      const data = await Advertisement.filter({ created_by: userEmail }, '-created_date');
      setAds(data);
    } catch (error) {
      console.error('Error loading ads:', error);
      setAds([]);
    }
  };

  const handleSave = async (adData) => {
    try {
      if (editingAd) {
        await Advertisement.update(editingAd.id, adData);
      } else {
        await Advertisement.create({ ...adData, advertiser_name: user.full_name });
      }
      setShowForm(false);
      setEditingAd(null);
      await loadAds(user.email);
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('שגיאה בשמירת המודעה');
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setShowForm(true);
  };

  const handleDelete = async (adId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את המודעה?')) {
      try {
        await Advertisement.delete(adId);
        await loadAds(user.email);
      } catch (error) {
        console.error('Error deleting ad:', error);
        alert('שגיאה במחיקת המודעה');
      }
    }
  };

  const handleAddFunds = async () => {
    try {
      const currentBalance = user.balance || 0;
      const newBalance = currentBalance + 50;
      await User.updateMyUserData({ balance: newBalance });
      setUser(prev => ({ ...prev, balance: newBalance }));
      alert('50$ נוספו לחשבונך! (זוהי הדגמה בלבד)');
    } catch (error) {
      console.error('Error adding funds:', error);
      alert('שגיאה בהוספת תקציב');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">מאמת נתונים...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
       <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl">
          <ShieldX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">זהו אזור למפרסמים בלבד</h2>
          <p className="text-gray-500 mt-2 mb-6">כדי לנהל קמפיינים, עליך להתחבר לחשבון מחובר.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleLogin}>התחברות</Button>
            <Link to={createPageUrl("Register")}>
                <Button variant="outline">בקשה לפתיחת חשבון</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-green-100 p-3 rounded-xl">
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">פאנל מפרסמים</h1>
            <p className="text-gray-600">שלום {user?.full_name || 'משתמש'}, נהל את המודעות שלך ועקוב אחר הביצועים.</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowForm(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-5 h-5 ml-2" />
          מודעה חדשה
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">יתרה</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(user?.balance || 0).toFixed(2)}</div>
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleAddFunds}>הוסף תקציב</Button>
          </CardContent>
        </Card>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">סך מודעות</CardTitle><BarChart3 className="w-4 h-4 text-muted-foreground"/></CardHeader>
          <CardContent><div className="text-2xl font-bold">{ads.length}</div></CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">סך חשיפות</CardTitle><Eye className="w-4 h-4 text-muted-foreground"/></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div></CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">סך קליקים</CardTitle><MousePointer className="w-4 h-4 text-muted-foreground"/></CardHeader>
          <CardContent><div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {showForm && (
        <AdForm
          ad={editingAd}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingAd(null);
          }}
        />
      )}

      <AdList 
        ads={ads}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}