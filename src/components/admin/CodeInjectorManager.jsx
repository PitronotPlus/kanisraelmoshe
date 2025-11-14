
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Code, Trash2, Edit, Save } from "lucide-react";

const InjectorForm = ({ injection, onSave, onCancel, isSaving }) => {
  const [data, setData] = useState(injection || {
    id: Date.now().toString(),
    code: '',
    type: 'html',
    position: 1,
    enabled: true,
  });

  const handleSave = () => {
    onSave(data);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>תוכן הקוד (HTML/JS)</Label>
        <Textarea
          value={data.code}
          onChange={(e) => setData({ ...data, code: e.target.value })}
          rows={10}
          className="font-mono text-sm"
          placeholder="<div...> או (function(){...})();"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>סוג הקוד</Label>
          <Select value={data.type} onValueChange={(value) => setData({ ...data, type: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>הטמע אחרי פסקה מספר</Label>
          <Input
            type="number"
            min="1"
            value={data.position}
            onChange={(e) => setData({ ...data, position: parseInt(e.target.value, 10) || 1 })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel} disabled={isSaving}>ביטול</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "שומר..." : <> <Save className="w-4 h-4 ml-2" /> שמור הטמעה </>}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default function CodeInjectorManager({ config, onConfigChange }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInjection, setEditingInjection] = useState(null);
  const [isSaving, setIsSaving] = useState(false); // New state for saving status

  const handleAddNew = () => {
    setEditingInjection(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (injection) => {
    setEditingInjection(injection);
    setIsDialogOpen(true);
  };

  const handleSave = async (injectionData) => {
    // Validate that the code is not empty
    if (!injectionData.code.trim()) {
      alert('חובה להזין קוד');
      return;
    }

    // Validate that the code doesn't contain dangerous eval patterns
    const dangerousPatterns = [
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(\s*['"`]/, // Matches setTimeout('...' or setTimeout("...")
      /setInterval\s*\(\s*['"`]/  // Matches setInterval('...' or setInterval("...")
    ];

    const hasDangerousCode = dangerousPatterns.some(pattern => pattern.test(injectionData.code));
    if (hasDangerousCode) {
      alert('הקוד מכיל פונקציות לא מאובטחות (eval, Function וכדומה). אנא השתמש בקוד בטוח יותר.');
      return;
    }

    try {
      setIsSaving(true);

      const injections = config.article_injects || [];
      const existingIndex = injections.findIndex(inj => inj.id === injectionData.id);

      let newInjections;
      if (existingIndex > -1) {
        // Update logic
        newInjections = [...injections];
        newInjections[existingIndex] = injectionData;
      } else {
        // Create logic
        newInjections = [...injections, injectionData];
      }

      onConfigChange({ ...config, article_injects: newInjections });
      setIsDialogOpen(false);
      setEditingInjection(null);
    } catch (error) {
      console.error("Failed to save injection:", error);
      alert('שגיאה בשמירת ההטמעה: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (injectionId) => {
    if (confirm('האם אתה בטוח שברצונך למחוק הטמעה זו?')) {
      const newInjections = (config.article_injects || []).filter(inj => inj.id !== injectionId);
      onConfigChange({ ...config, article_injects: newInjections });
    }
  };

  const toggleEnabled = (injectionId, enabled) => {
    const newInjections = (config.article_injects || []).map(inj =>
      inj.id === injectionId ? { ...inj, enabled } : inj
    );
    onConfigChange({ ...config, article_injects: newInjections });
  };

  const injections = config?.article_injects || [];

  return (
    <Card className="shadow-lg border-0 rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white py-4 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 space-x-reverse text-gray-700">
            <Code className="w-5 h-5" />
            <span>הטמעת קוד במאמרים</span>
          </CardTitle>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="w-4 h-4 ml-2" /> הוסף הטמעה חדשה
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {injections.length === 0 ? (
          <p className="text-gray-500 text-center py-4">לא הוגדרו הטמעות קוד.</p>
        ) : (
          <div className="space-y-3">
            {injections.map(injection => (
              <div key={injection.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <p className="font-mono text-sm truncate max-w-sm text-gray-700 font-semibold">{injection.code}</p>
                  <p className="text-xs text-gray-500">
                    סוג: {injection.type.toUpperCase()} | מיקום: אחרי פסקה {injection.position}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={injection.enabled}
                    onCheckedChange={(checked) => toggleEnabled(injection.id, checked)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(injection)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(injection.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInjection ? 'עריכת הטמעה' : 'הוספת הטמעה חדשה'}</DialogTitle>
          </DialogHeader>
          <InjectorForm
            injection={editingInjection}
            onSave={handleSave}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingInjection(null);
            }}
            isSaving={isSaving} // Pass saving status to form
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
