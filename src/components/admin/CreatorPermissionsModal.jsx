import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CreatorPermissionsModal({ isOpen, onClose, creator, allCategories, onSave }) {
  const [selectedSlugs, setSelectedSlugs] = useState(new Set());

  useEffect(() => {
    if (creator?.allowed_categories) {
      setSelectedSlugs(new Set(creator.allowed_categories));
    } else {
      setSelectedSlugs(new Set());
    }
  }, [creator]);

  const handleToggle = (slug, checked) => {
    const newSlugs = new Set(selectedSlugs);
    if (checked) {
      newSlugs.add(slug);
    } else {
      newSlugs.delete(slug);
    }
    setSelectedSlugs(newSlugs);
  };

  const handleSave = () => {
    onSave(creator.id, Array.from(selectedSlugs));
    onClose();
  };

  const buildCategoryList = (parentId = null, level = 0) => {
    return allCategories
      .filter(cat => cat.parent_id === parentId)
      .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0))
      .flatMap(cat => [
        <div 
          key={cat.id} 
          className="flex items-center space-x-2 space-x-reverse py-2 px-2 rounded"
          style={{ paddingRight: `${level * 20 + 8}px` }}
        >
          <Checkbox
            id={`perm-cat-${cat.id}`}
            checked={selectedSlugs.has(cat.slug)}
            onCheckedChange={(checked) => handleToggle(cat.slug, checked)}
          />
          <Label htmlFor={`perm-cat-${cat.id}`} className="font-normal cursor-pointer">
            {cat.name}
          </Label>
        </div>,
        ...buildCategoryList(cat.id, level + 1)
      ]);
  };

  if (!creator) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ניהול הרשאות קטגוריה עבור {creator.full_name}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-500 mb-4">בחר את הקטגוריות שבהן {creator.full_name} יכול לפרסם. אם לא תבחר כלום, תהיה לו גישה לכל הקטגוריות.</p>
          <ScrollArea className="h-72 w-full rounded-md border p-4">
            {buildCategoryList()}
          </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">ביטול</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>שמור שינויים</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}