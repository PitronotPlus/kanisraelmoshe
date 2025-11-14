import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { SiteConfig } from "@/entities/SiteConfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save } from "lucide-react";

export default function AdminSettings() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    site_name: "כאן ישראל",
    site_description: "אתר החדשות המוביל בישראל",
    primary_color: "#2563eb",
    accent_color: "#dc2626",
    background_color: "#f9fafb",
    text_color_primary: "#111827",
    text_color_secondary: "#6b7281",
    font_family: "Assistant",
    logo_height: 64
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await User.me();
        
        if (currentUser && currentUser.role === 'admin') {
          setUser(currentUser);
          setIsAuthorized(true);
          
          // Load site config
          const configData = await SiteConfig.list();
          if (configData && configData.length > 0) {
            setConfig(configData[0]);
          }
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update or create site config
      const existingConfigs = await SiteConfig.list();
      
      if (existingConfigs && existingConfigs.length > 0) {
        await SiteConfig.update(existingConfigs[0].id, config);
      } else {
        await SiteConfig.create(config);
      }
      
      alert('הגדרות נשמרו בהצלחה!');
      
      // Reload page to apply changes
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען הגדרות...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">אין הרשאה</h2>
          <p className="text-gray-600">אין לך הרשאות לצפות בדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-purple-100 p-3 rounded-xl">
            <Settings className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">הגדרות אתר</h1>
            <p className="text-gray-600">נהל את הגדרות האתר והעיצוב</p>
          </div>
        </div>
        
        <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
              שומר...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 ml-2" />
              שמור הגדרות
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">הגדרות כלליות</TabsTrigger>
          <TabsTrigger value="design">עיצוב וצבעים</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>מידע כללי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site_name">שם האתר</Label>
                <Input
                  id="site_name"
                  value={config.site_name}
                  onChange={(e) => setConfig({...config, site_name: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="site_description">תיאור האתר</Label>
                <Textarea
                  id="site_description"
                  value={config.site_description}
                  onChange={(e) => setConfig({...config, site_description: e.target.value})}
                  className="h-20"
                />
              </div>

              <div>
                <Label htmlFor="logo_height">גובה הלוגו (פיקסלים)</Label>
                <Input
                  id="logo_height"
                  type="number"
                  value={config.logo_height}
                  onChange={(e) => setConfig({...config, logo_height: parseInt(e.target.value)})}
                  min="30"
                  max="120"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>עיצוב וצבעים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="font_family">פונט ראשי</Label>
                <Select 
                  value={config.font_family} 
                  onValueChange={(value) => setConfig({...config, font_family: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Assistant">Assistant</SelectItem>
                    <SelectItem value="Heebo">Heebo</SelectItem>
                    <SelectItem value="Arimo">Arimo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary_color">צבע ראשי</Label>
                  <Input
                    id="primary_color"
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({...config, primary_color: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="accent_color">צבע משני</Label>
                  <Input
                    id="accent_color"
                    type="color"
                    value={config.accent_color}
                    onChange={(e) => setConfig({...config, accent_color: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="text_color_primary">צבע טקסט ראשי</Label>
                  <Input
                    id="text_color_primary"
                    type="color"
                    value={config.text_color_primary}
                    onChange={(e) => setConfig({...config, text_color_primary: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="text_color_secondary">צבע טקסט משני</Label>
                  <Input
                    id="text_color_secondary"
                    type="color"
                    value={config.text_color_secondary}
                    onChange={(e) => setConfig({...config, text_color_secondary: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="background_color">צבע רקע</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={config.background_color}
                  onChange={(e) => setConfig({...config, background_color: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}