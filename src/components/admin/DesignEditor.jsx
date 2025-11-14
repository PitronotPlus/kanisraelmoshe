import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/integrations/Core";
import { Palette, Type, Upload, Trash2, Save, PlusCircle, Loader2 } from 'lucide-react';

const ColorInput = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <Label>{label}</Label>
    <div className="flex items-center gap-2">
      <Input
        type="color"
        value={value || '#ffffff'}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-10 p-1"
      />
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#ffffff"
      />
    </div>
  </div>
);

const TypographyRule = ({ ruleKey, rule, onUpdate, onDelete, availableFonts }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 border rounded-lg bg-gray-50/50">
      <div className="font-mono font-bold text-lg md:col-span-4">{ruleKey}</div>
      
      <div className="space-y-2">
        <Label>משפחת גופנים</Label>
        <Select
          value={rule.fontFamily || ''}
          onValueChange={(value) => onUpdate(ruleKey, { ...rule, fontFamily: value })}
        >
          <SelectTrigger><SelectValue placeholder="בחר גופן" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>ברירת מחדל</SelectItem>
            {availableFonts.map(font => (
              <SelectItem key={font.value} value={font.label}>{font.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>משקל גופן</Label>
        <Input
          type="number"
          step="100"
          min="100"
          max="900"
          value={rule.fontWeight || ''}
          onChange={(e) => onUpdate(ruleKey, { ...rule, fontWeight: e.target.value })}
          placeholder="400"
        />
      </div>

      <div className="space-y-2">
        <Label>צבע</Label>
        <Input
          type="color"
          value={rule.color || '#000000'}
          onChange={(e) => onUpdate(ruleKey, { ...rule, color: e.target.value })}
          className="w-full h-10"
        />
      </div>

      <Button variant="destructive" size="icon" onClick={() => onDelete(ruleKey)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
};


const DesignEditor = ({ config, onConfigChange, onSave }) => {
  const [uploadingFont, setUploadingFont] = useState(false);
  const [newRuleElement, setNewRuleElement] = useState('');

  const handleUpdate = (key, value) => {
    onConfigChange(prev => ({ ...prev, [key]: value }));
  };

  const handleTypographyUpdate = (element, styles) => {
    const newTypography = { ...(config.typography || {}), [element]: styles };
    handleUpdate('typography', newTypography);
  };
  
  const handleAddTypographyRule = () => {
    if (newRuleElement && !(config.typography && config.typography[newRuleElement])) {
      handleTypographyUpdate(newRuleElement, { fontFamily: '', fontWeight: 400, color: '#000000' });
      setNewRuleElement('');
    }
  };

  const handleDeleteTypographyRule = (element) => {
    const { [element]: _, ...remainingRules } = (config.typography || {});
    handleUpdate('typography', remainingRules);
  };
  
  const handleFontUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fontFamilyName = prompt('אנא הזן את שם משפחת הגופנים (לדוגמה, "My Custom Font"):');
    if (!fontFamilyName) return;

    setUploadingFont(true);
    try {
      const { file_url } = await UploadFile({ file });
      const fontFile = {
        name: file.name,
        url: file_url,
        format: file.name.split('.').pop().toLowerCase()
      };
      
      const customFonts = [...(config.custom_fonts || [])];
      const existingFontFamily = customFonts.find(f => f.familyName === fontFamilyName);

      if (existingFontFamily) {
        existingFontFamily.files.push(fontFile);
      } else {
        customFonts.push({
          id: `font_${Date.now()}`,
          familyName: fontFamilyName,
          files: [fontFile]
        });
      }
      
      handleUpdate('custom_fonts', customFonts);
    } catch (error) {
      console.error('Error uploading font:', error);
      alert('שגיאה בהעלאת הגופן.');
    } finally {
      setUploadingFont(false);
    }
  };

  const handleDeleteCustomFont = (fontFamilyName) => {
    const updatedFonts = (config.custom_fonts || []).filter(f => f.familyName !== fontFamilyName);
    handleUpdate('custom_fonts', updatedFonts);
  };

  const globalFonts = [
    { label: 'Assistant', value: 'Assistant' },
    { label: 'Heebo', value: 'Heebo' },
    { label: 'Arimo', value: 'Arimo' },
    { label: 'Rubik', value: 'Rubik' },
    { label: 'Open Sans', value: 'Open Sans' },
  ];
  
  const customFonts = (config?.custom_fonts || []).map(f => ({ label: f.familyName, value: f.familyName }));
  const availableFonts = [...globalFonts, ...customFonts];

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between sticky top-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg z-10 border">
          <h3 className="text-xl font-bold">עורך עיצוב</h3>
          <Button onClick={onSave}>
            <Save className="w-4 h-4 ml-2" />
            שמור את כל השינויים
          </Button>
        </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette/> צבעים גלובליים</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ColorInput label="צבע ראשי" value={config.primary_color} onChange={(val) => handleUpdate('primary_color', val)} />
          <ColorInput label="צבע משני (Accent)" value={config.accent_color} onChange={(val) => handleUpdate('accent_color', val)} />
          <ColorInput label="צבע רקע" value={config.background_color} onChange={(val) => handleUpdate('background_color', val)} />
          <ColorInput label="צבע טקסט ראשי" value={config.text_color_primary} onChange={(val) => handleUpdate('text_color_primary', val)} />
          <ColorInput label="צבע טקסט משני" value={config.text_color_secondary} onChange={(val) => handleUpdate('text_color_secondary', val)} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Type/> טיפוגרפיה גלובלית</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2 max-w-sm">
                <Label>גופן ראשי לאתר</Label>
                <Select value={config.font_family} onValueChange={(val) => handleUpdate('font_family', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {availableFonts.map(font => (
                            <SelectItem key={font.value} value={font.label}>{font.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2 max-w-sm">
                <Label>גובה הלוגו (בפיקסלים)</Label>
                <Input type="number" value={config.logo_height || 64} onChange={e => handleUpdate('logo_height', parseInt(e.target.value))}/>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload /> גופנים מותאמים</CardTitle>
          <p className="text-sm text-gray-500">העלה קבצי גופנים (ttf, woff, woff2) כדי להשתמש בהם באתר.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border p-4 rounded-lg">
            <input type="file" id="font-uploader" className="hidden" onChange={handleFontUpload} accept=".ttf,.otf,.woff,.woff2"/>
            <Button variant="outline" onClick={() => document.getElementById('font-uploader').click()} disabled={uploadingFont}>
              {uploadingFont ? <Loader2 className="w-4 h-4 ml-2 animate-spin"/> : <Upload className="w-4 h-4 ml-2"/>}
              {uploadingFont ? 'מעלה קובץ...' : 'העלה קובץ גופן'}
            </Button>
          </div>
          <div className="space-y-2">
            {(config.custom_fonts || []).map(font => (
              <div key={font.id} className="flex items-center justify-between p-2 border rounded-md">
                <span className="font-semibold">{font.familyName} ({font.files.length} קבצים)</span>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomFont(font.familyName)}>
                  <Trash2 className="w-4 h-4 text-red-500"/>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>חוקי טיפוגרפיה מתקדמים</CardTitle>
          <p className="text-sm text-gray-500">קבע עיצוב ספציפי עבור אלמנטים שונים באתר (למשל, h1, h2, p). הגדרות אלו ידחפו את ההגדרות הגלובליות.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-4 border rounded-lg bg-gray-50">
            <Input 
              value={newRuleElement}
              onChange={(e) => setNewRuleElement(e.target.value)}
              placeholder="שם אלמנט (לדוגמה: h1, .title-class)"
              className="flex-1"
            />
            <Button onClick={handleAddTypographyRule}><PlusCircle className="w-4 h-4 ml-2"/> הוסף חוק</Button>
          </div>
          <div className="space-y-4">
            {config.typography && Object.entries(config.typography).map(([key, value]) => (
              <TypographyRule 
                key={key}
                ruleKey={key}
                rule={value}
                onUpdate={handleTypographyUpdate}
                onDelete={handleDeleteTypographyRule}
                availableFonts={availableFonts}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DesignEditor;