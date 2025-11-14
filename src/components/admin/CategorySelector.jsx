import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

export default function CategorySelector({ allCategories, selected, onChange }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  
  const selectedSlugs = new Set([
    ...(selected?.primary ? [selected.primary] : []),
    ...(selected?.secondary || [])
  ]);

  const handleCategoryToggle = (slug, checked) => {
    let newPrimary = selected?.primary || '';
    let newSecondary = selected?.secondary ? [...selected.secondary] : [];

    if (checked) {
      if (!newPrimary) {
        // אם אין קטגוריה ראשית, הקטגוריה הזו תהיה הראשית
        newPrimary = slug;
      } else {
        // אחרת תתווסף כמשנית
        newSecondary.push(slug);
      }
    } else {
      if (newPrimary === slug) {
        // אם מסירים את הקטגוריה הראשית
        if (newSecondary.length > 0) {
          // הראשונה מהמשניות תהפוך לראשית
          newPrimary = newSecondary.shift();
        } else {
          newPrimary = '';
        }
      } else {
        // מסירים מהמשניות
        newSecondary = newSecondary.filter(s => s !== slug);
      }
    }
    
    onChange({ primary: newPrimary, secondary: newSecondary });
  };

  const handleSetPrimary = (slug) => {
    if (!selectedSlugs.has(slug)) return;

    const otherCategories = Array.from(selectedSlugs).filter(s => s !== slug);
    onChange({ primary: slug, secondary: otherCategories });
  };

  const buildCategoryList = (parentId = null, level = 0) => {
    return allCategories
      .filter(cat => cat.parent_id === parentId)
      .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0))
      .flatMap(cat => [
        <div 
          key={cat.id} 
          className="group flex items-center justify-between py-2 px-2 rounded hover:bg-gray-50 transition-colors"
          style={{ paddingRight: `${level * 20 + 8}px` }}
          onMouseEnter={() => setHoveredCategory(cat.slug)}
          onMouseLeave={() => setHoveredCategory(null)}
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox
              id={`cat-${cat.id}`}
              checked={selectedSlugs.has(cat.slug)}
              onCheckedChange={(checked) => handleCategoryToggle(cat.slug, checked)}
            />
            <Label htmlFor={`cat-${cat.id}`} className="font-normal cursor-pointer flex items-center space-x-2 space-x-reverse">
              <span>{cat.name}</span>
              {selected?.primary === cat.slug && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  ראשית
                </Badge>
              )}
            </Label>
          </div>
          
          {/* כפתור הפיכה לראשית - מופיע רק בהעברת עכבר */}
          {selectedSlugs.has(cat.slug) && selected?.primary !== cat.slug && hoveredCategory === cat.slug && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSetPrimary(cat.slug)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-6 px-2"
            >
              <Star className="w-3 h-3 ml-1" />
              הפוך לראשית
            </Button>
          )}
        </div>,
        ...buildCategoryList(cat.id, level + 1)
      ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>קטגוריות ותגיות</CardTitle>
        <p className="text-sm text-gray-600">
          בחר קטגוריות למאמר. הקטגוריה הראשונה שתבחר תהפוך לקטגוריה הראשית.
        </p>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {allCategories.filter(cat => !cat.parent_id).length > 0 ? (
          buildCategoryList()
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">אין קטגוריות זמינות</p>
        )}
        
        {selectedSlugs.size > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-700 mb-2">קטגוריות נבחרות:</h4>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedSlugs).map(slug => {
                const category = allCategories.find(c => c.slug === slug);
                const isPrimary = selected?.primary === slug;
                return (
                  <Badge 
                    key={slug} 
                    variant={isPrimary ? "default" : "secondary"}
                    className={isPrimary ? "bg-blue-600 text-white" : ""}
                  >
                    {category?.name}
                    {isPrimary && " (ראשית)"}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}