import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, X } from "lucide-react";
import { base44 } from '@/api/base44Client';

// Available header style presets
const HEADER_STYLES = {
  backgrounds: [
    { id: 'bg-red-blue-1', name: 'אדום-כחול 1', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/5f329ab0c_1.png' },
    { id: 'bg-blue-red-1', name: 'כחול-אדום 1', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/26fc3732f_2.png' },
    { id: 'bg-blue-red-2', name: 'כחול-אדום 2', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/65d72ecc4_3.png' },
    { id: 'bg-red-blue-rounded', name: 'אדום-כחול מעוגל', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/e8a90718b_4.png' },
    { id: 'bg-red-blue-2', name: 'אדום-כחול 2', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/40a6de499_5.png' },
  ],
  lines: [
    { id: 'line-red', name: 'קו אדום', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/367dc3e38_Screenshot_1.jpg' },
    { id: 'line-blue', name: 'קו כחול', url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68701c57df55f5f96aeb5a04/f6810d756_Screenshot_5.jpg' },
  ]
};

export default function CategoryAddForm({ category, mainCategories, onAdd, onChange }) {
    const [isUploading, setIsUploading] = useState(false);

    // Ensure header_style exists with defaults
    const headerStyle = category.header_style || { type: 'background', image_url: HEADER_STYLES.backgrounds[0].url };

    const generateSlug = (name) => {
        return name.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\u0590-\u05FF\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            onChange({ ...category, hero_background_image: file_url });
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('שגיאה בהעלאת התמונה');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveImage = () => {
        onChange({ ...category, hero_background_image: '' });
    };
    
    const handleHeaderStyleChange = (newStyle) => {
        onChange({ ...category, header_style: { ...headerStyle, ...newStyle } });
    };

    return (
        <div className="p-4 border rounded-md bg-gray-50 space-y-4">
            <h4 className="font-semibold">הוספת קטגוריה חדשה</h4>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>שם קטגוריה</Label>
                    <Input 
                        value={category.name} 
                        onChange={(e) => onChange({...category, name: e.target.value, slug: generateSlug(e.target.value)})}
                        placeholder="שם קטגוריה"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input 
                        value={category.slug} 
                        onChange={(e) => onChange({...category, slug: e.target.value})}
                        placeholder="Slug"
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>קטגוריית אב (אופציונלי)</Label>
                <Select onValueChange={(value) => onChange({...category, parent_id: value})}>
                    <SelectTrigger><SelectValue placeholder="בחר קטגוריית אב (אופציונלי)" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={null}>ללא אב (קטגוריה ראשית)</SelectItem>
                        {mainCategories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Header Style Selection */}
            <div className="space-y-3 p-4 border rounded-md bg-white">
                <Label className="text-base font-semibold">סגנון כותרת</Label>
                
                <RadioGroup 
                    value={headerStyle.type} 
                    onValueChange={(value) => handleHeaderStyleChange({ type: value })}
                    className="flex gap-4"
                >
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="background" id="add-type-background" />
                        <Label htmlFor="add-type-background">רקע</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="line" id="add-type-line" />
                        <Label htmlFor="add-type-line">קו</Label>
                    </div>
                </RadioGroup>

                {headerStyle.type === 'background' && (
                    <div className="space-y-2">
                        <Label>בחר רקע</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {HEADER_STYLES.backgrounds.map((bg) => (
                                <button
                                    key={bg.id}
                                    type="button"
                                    onClick={() => handleHeaderStyleChange({ image_url: bg.url })}
                                    className={`p-2 border-2 rounded-lg transition-all ${
                                        headerStyle.image_url === bg.url 
                                            ? 'border-blue-600 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <img 
                                        src={bg.url} 
                                        alt={bg.name}
                                        className="w-full h-12 object-cover rounded"
                                    />
                                    <p className="text-xs mt-1 text-center">{bg.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {headerStyle.type === 'line' && (
                    <div className="space-y-2">
                        <Label>בחר קו</Label>
                        <div className="grid grid-cols-2 gap-3">
                            {HEADER_STYLES.lines.map((line) => (
                                <button
                                    key={line.id}
                                    type="button"
                                    onClick={() => handleHeaderStyleChange({ image_url: line.url })}
                                    className={`p-2 border-2 rounded-lg transition-all ${
                                        headerStyle.image_url === line.url 
                                            ? 'border-blue-600 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                >
                                    <img 
                                        src={line.url} 
                                        alt={line.name}
                                        className="w-full h-3 object-cover rounded"
                                    />
                                    <p className="text-xs mt-1 text-center">{line.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Hero Background Image */}
            <div className="space-y-2">
                <Label>תמונת רקע לדף הקטגוריה (אופציונלי)</Label>
                {category.hero_background_image && (
                    <div className="relative inline-block">
                        <img 
                            src={category.hero_background_image} 
                            alt="תמונת רקע"
                            className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveImage}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                )}
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="hero-bg-upload-new"
                    />
                    <Button
                        variant="outline"
                        onClick={() => document.getElementById('hero-bg-upload-new')?.click()}
                        disabled={isUploading}
                        className="w-full"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin ml-2"></div>
                                מעלה...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 ml-2" />
                                העלה תמונה
                            </>
                        )}
                    </Button>
                </div>
            </div>
            
            <Button onClick={onAdd} className="w-full">הוסף קטגוריה</Button>
        </div>
    );
}