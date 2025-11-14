import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
    Image as ImageIcon, 
    AlignLeft, 
    AlignCenter, 
    AlignRight, 
    Save, 
    X,
    Eye
} from "lucide-react";

export default function ImageEditor({ imageUrl, onSave, onCancel, initialData = {} }) {
    const [imageData, setImageData] = useState({
        src: imageUrl || '',
        alt: '',
        caption: '',
        title: '',
        width: 'auto',
        height: 'auto',
        alignment: 'center',
        linkUrl: '',
        linkTarget: '_blank',
        enableLink: false,
        customClass: '',
        borderRadius: 0,
        shadow: false,
        ...initialData
    });

    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        if (imageUrl) {
            setImageData(prev => ({ ...prev, src: imageUrl }));
        }
    }, [imageUrl]);

    const handleChange = (field, value) => {
        setImageData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        const htmlString = generateImageHtml(imageData);
        onSave(htmlString, imageData);
    };

    const generateImageHtml = (data) => {
        const {
            src,
            alt,
            caption,
            title,
            width,
            height,
            alignment,
            linkUrl,
            linkTarget,
            enableLink,
            customClass,
            borderRadius,
            shadow
        } = data;

        // Build style string
        const styles = [];
        if (width !== 'auto') styles.push(`width: ${width}px`);
        if (height !== 'auto') styles.push(`height: ${height}px`);
        if (borderRadius > 0) styles.push(`border-radius: ${borderRadius}px`);
        if (shadow) styles.push(`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`);
        
        // Build class string
        const classes = ['editor-image'];
        if (customClass) classes.push(customClass);
        
        // Alignment classes
        switch (alignment) {
            case 'left':
                classes.push('float-left');
                styles.push('margin: 0 16px 16px 0');
                break;
            case 'right':
                classes.push('float-right');
                styles.push('margin: 0 0 16px 16px');
                break;
            case 'center':
                styles.push('display: block; margin: 16px auto');
                break;
        }

        // Create image element
        const imgElement = `<img src="${src}" alt="${alt}" title="${title}" class="${classes.join(' ')}" style="${styles.join('; ')}" />`;
        
        // Wrap with link if enabled
        const imageWithLink = enableLink && linkUrl 
            ? `<a href="${linkUrl}" target="${linkTarget}" class="editor-image-link">${imgElement}</a>`
            : imgElement;

        // Add caption if provided
        const finalHtml = caption 
            ? `<figure class="editor-image-figure" style="text-align: ${alignment}; margin: 16px 0;">
                ${imageWithLink}
                <figcaption class="editor-image-caption" style="font-size: 0.875rem; color: #666; margin-top: 8px; font-style: italic;">${caption}</figcaption>
               </figure>`
            : `<div class="editor-image-wrapper" style="text-align: ${alignment}; margin: 16px 0;">${imageWithLink}</div>`;

        return finalHtml;
    };

    const sizePresets = [
        { label: 'אוטומטי', value: 'auto' },
        { label: 'קטן (200px)', value: '200' },
        { label: 'בינוני (400px)', value: '400' },
        { label: 'גדול (600px)', value: '600' },
        { label: 'מלא (800px)', value: '800' }
    ];

    const alignmentOptions = [
        { label: 'שמאל', value: 'left', icon: AlignLeft },
        { label: 'מרכז', value: 'center', icon: AlignCenter },
        { label: 'ימין', value: 'right', icon: AlignRight }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5" />
                            עריכת תמונה
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => setPreviewMode(!previewMode)}
                            >
                                <Eye className="w-4 h-4 ml-1" />
                                {previewMode ? 'עריכה' : 'תצוגה מקדימה'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={onCancel}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Panel - Settings */}
                        <div className="space-y-6">
                            <Tabs defaultValue="basic" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="basic">בסיסי</TabsTrigger>
                                    <TabsTrigger value="advanced">מתקדם</TabsTrigger>
                                    <TabsTrigger value="link">קישור</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="basic" className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>טקסט חלופי (Alt Text)</Label>
                                        <Input
                                            value={imageData.alt}
                                            onChange={(e) => handleChange('alt', e.target.value)}
                                            placeholder="תיאור התמונה לנגישות..."
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>כותרת (Title)</Label>
                                        <Input
                                            value={imageData.title}
                                            onChange={(e) => handleChange('title', e.target.value)}
                                            placeholder="כותרת שמופיעה בעת ריחוף..."
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>כיתוב (Caption)</Label>
                                        <Textarea
                                            value={imageData.caption}
                                            onChange={(e) => handleChange('caption', e.target.value)}
                                            placeholder="כיתוב שמופיע מתחת לתמונה..."
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>יישור</Label>
                                        <div className="flex gap-2">
                                            {alignmentOptions.map(option => (
                                                <Button
                                                    key={option.value}
                                                    variant={imageData.alignment === option.value ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleChange('alignment', option.value)}
                                                    className="flex items-center gap-2"
                                                >
                                                    <option.icon className="w-4 h-4" />
                                                    {option.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="advanced" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>רוחב</Label>
                                            <Select value={imageData.width} onValueChange={(value) => handleChange('width', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="בחר רוחב" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sizePresets.map(preset => (
                                                        <SelectItem key={preset.value} value={preset.value}>
                                                            {preset.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label>גובה</Label>
                                            <Select value={imageData.height} onValueChange={(value) => handleChange('height', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="בחר גובה" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {sizePresets.map(preset => (
                                                        <SelectItem key={preset.value} value={preset.value}>
                                                            {preset.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>עיגול פינות ({imageData.borderRadius}px)</Label>
                                        <Slider
                                            value={[imageData.borderRadius]}
                                            onValueChange={(value) => handleChange('borderRadius', value[0])}
                                            max={50}
                                            step={1}
                                            className="w-full"
                                        />
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <Label>צל</Label>
                                        <Switch
                                            checked={imageData.shadow}
                                            onCheckedChange={(checked) => handleChange('shadow', checked)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label>מחלקת CSS מותאמת</Label>
                                        <Input
                                            value={imageData.customClass}
                                            onChange={(e) => handleChange('customClass', e.target.value)}
                                            placeholder="custom-image-class"
                                        />
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="link" className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label>הפוך תמונה לקישור</Label>
                                        <Switch
                                            checked={imageData.enableLink}
                                            onCheckedChange={(checked) => handleChange('enableLink', checked)}
                                        />
                                    </div>
                                    
                                    {imageData.enableLink && (
                                        <>
                                            <div className="space-y-2">
                                                <Label>כתובת קישור</Label>
                                                <Input
                                                    value={imageData.linkUrl}
                                                    onChange={(e) => handleChange('linkUrl', e.target.value)}
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label>פתח קישור ב:</Label>
                                                <Select value={imageData.linkTarget} onValueChange={(value) => handleChange('linkTarget', value)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="_blank">כרטיסיה חדשה</SelectItem>
                                                        <SelectItem value="_self">אותה כרטיסיה</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                        
                        {/* Right Panel - Preview */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>תצוגה מקדימה</Label>
                                <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
                                    {previewMode ? (
                                        <div 
                                            dangerouslySetInnerHTML={{ __html: generateImageHtml(imageData) }}
                                            className="preview-content"
                                        />
                                    ) : (
                                        <div className="text-center">
                                            {imageData.src ? (
                                                <img 
                                                    src={imageData.src} 
                                                    alt={imageData.alt || 'תצוגה מקדימה'} 
                                                    className="max-w-full max-h-[250px] mx-auto rounded"
                                                    style={{
                                                        width: imageData.width !== 'auto' ? `${imageData.width}px` : 'auto',
                                                        height: imageData.height !== 'auto' ? `${imageData.height}px` : 'auto',
                                                        borderRadius: `${imageData.borderRadius}px`,
                                                        boxShadow: imageData.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-gray-200 rounded flex items-center justify-center">
                                                    <ImageIcon className="w-12 h-12 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Settings Summary */}
                            <div className="space-y-2">
                                <Label>סיכום הגדרות</Label>
                                <div className="space-y-2">
                                    {imageData.alt && <Badge variant="outline">Alt: {imageData.alt}</Badge>}
                                    {imageData.caption && <Badge variant="outline">כיתוב: {imageData.caption}</Badge>}
                                    {imageData.enableLink && imageData.linkUrl && <Badge variant="outline">קישור: {imageData.linkUrl}</Badge>}
                                    <Badge variant="outline">יישור: {alignmentOptions.find(a => a.value === imageData.alignment)?.label}</Badge>
                                    {imageData.width !== 'auto' && <Badge variant="outline">רוחב: {imageData.width}px</Badge>}
                                    {imageData.height !== 'auto' && <Badge variant="outline">גובה: {imageData.height}px</Badge>}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={onCancel}>
                            ביטול
                        </Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 ml-2" />
                            שמור שינויים
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}