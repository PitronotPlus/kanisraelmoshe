
import { useState, useEffect } from "react";
import { Advertisement } from "@/entities/Advertisement"; // Changed from "@/entities/all"
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Plus, Eye, MousePointer, Calendar } from "lucide-react";

import AdForm from "../advertisers/AdForm";
import AdList from "../advertisers/AdList";

export default function AdminAdvertisers() {
  const [ads, setAds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const data = await Advertisement.list('-created_date');
      setAds(data);
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (adData) => {
    try {
      if (editingAd) {
        await Advertisement.update(editingAd.id, adData);
      } else {
        await Advertisement.create(adData);
      }
      setShowForm(false);
      setEditingAd(null);
      loadAds();
    } catch (error) {
      console.error('Error saving ad:', error);
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
        loadAds();
      } catch (error) {
        console.error('Error deleting ad:', error);
      }
    }
  };

  const totalImpressions = ads.reduce((sum, ad) => sum + (ad.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, ad) => sum + (ad.clicks || 0), 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען מודעות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-green-100 p-3 rounded-xl">
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">פאנל מפרסמים</h2>
            <p className="text-gray-600">נהל את המודעות שלך ועקוב אחר הביצועים</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סך מודעות</p>
                <p className="text-2xl font-bold text-gray-900">{ads.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סך חשיפות</p>
                <p className="text-2xl font-bold text-gray-900">{totalImpressions.toLocaleString()}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סך קליקים</p>
                <p className="text-2xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <MousePointer className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CTR</p>
                <p className="text-2xl font-bold text-gray-900">{ctr}%</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
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

      {/* Ads List */}
      <AdList 
        ads={ads}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
