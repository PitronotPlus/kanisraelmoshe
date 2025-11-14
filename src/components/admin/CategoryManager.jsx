import { useState, useEffect } from "react";
import { Category } from "@/entities/Category";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  GripVertical, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  FolderTree
} from "lucide-react";

export default function CategoryManager({ allCategories, setAllCategories, stats, setStats }) {
  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    color_class: 'blue',
    hero_background_image: '',
    sort_order: 0
  });
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await Category.list('sort_order');
        setAllCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
  }, [setAllCategories]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('נא להזין שם קטגוריה');
      return;
    }

    try {
      const categoryData = {
        ...newCategory,
        slug: newCategory.slug || generateSlug(newCategory.name),
        sort_order: allCategories.length
      };

      const createdCategory = await Category.create(categoryData);
      setAllCategories(prev => [...prev, createdCategory]);
      setNewCategory({
        name: '',
        slug: '',
        description: '',
        parent_id: '',
        color_class: 'blue',
        hero_background_image: '',
        sort_order: 0
      });
      
      // Update stats
      if (stats && setStats) {
        setStats(prev => ({ ...prev, categories: prev.categories + 1 }));
      }
      
      alert('הקטגוריה נוספה בהצלחה!');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('שגיאה בהוספת הקטגוריה');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory({ ...category });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory.name.trim()) {
      alert('נא להזין שם קטגוריה');
      return;
    }

    try {
      const updatedCategory = await Category.update(editingCategory.id, {
        ...editingCategory,
        slug: editingCategory.slug || generateSlug(editingCategory.name)
      });
      
      setAllCategories(prev => 
        prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
      );
      setEditingCategory(null);
      alert('הקטגוריה עודכנה בהצלחה!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('שגיאה בעדכון הקטגוריה');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הקטגוריה? פעולה זו תשפיע על כל המאמרים הקשורים.')) {
      return;
    }

    try {
      await Category.delete(categoryId);
      setAllCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      // Update stats
      if (stats && setStats) {
        setStats(prev => ({ ...prev, categories: prev.categories - 1 }));
      }
      
      alert('הקטגוריה נמחקה בהצלחה!');
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('שגיאה במחיקת הקטגוריה');
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(allCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order for all items
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index
    }));

    setAllCategories(updatedItems);

    // Update in database
    try {
      await Promise.all(
        updatedItems.map(item => 
          Category.update(item.id, { sort_order: item.sort_order })
        )
      );
    } catch (error) {
      console.error('Error updating category order:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) {
      alert('נא לבחור קטגוריות למחיקה');
      return;
    }

    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedCategories.length} קטגוריות?`)) {
      return;
    }

    try {
      await Promise.all(selectedCategories.map(id => Category.delete(id)));
      setAllCategories(prev => prev.filter(cat => !selectedCategories.includes(cat.id)));
      setSelectedCategories([]);
      setShowBulkActions(false);
      
      // Update stats
      if (stats && setStats) {
        setStats(prev => ({ ...prev, categories: prev.categories - selectedCategories.length }));
      }
      
      alert('הקטגוריות נמחקו בהצלחה!');
    } catch (error) {
      console.error('Error bulk deleting categories:', error);
      alert('שגיאה במחיקת הקטגוריות');
    }
  };

  const mainCategories = allCategories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId) => allCategories.filter(cat => cat.parent_id === parentId);

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    indigo: 'bg-indigo-100 text-indigo-800'
  };

  return (
    <div className="space-y-8">
      {/* Add New Category */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Plus className="w-5 h-5" />
            <span>הוספת קטגוריה חדשה</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">שם הקטגוריה</Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({
                  ...prev,
                  name: e.target.value,
                  slug: generateSlug(e.target.value)
                }))}
                placeholder="הזן שם קטגוריה..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug (קישור)</Label>
              <Input
                id="category-slug"
                value={newCategory.slug}
                onChange={(e) => setNewCategory(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">תיאור</Label>
            <Textarea
              id="category-description"
              value={newCategory.description}
              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור קצר של הקטגוריה..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parent-category">קטגורית אב</Label>
              <Select 
                value={newCategory.parent_id} 
                onValueChange={(value) => setNewCategory(prev => ({ ...prev, parent_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגורית אב (אופציונלי)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא קטגורית אב</SelectItem>
                  {mainCategories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color-class">צבע</Label>
              <Select 
                value={newCategory.color_class} 
                onValueChange={(value) => setNewCategory(prev => ({ ...prev, color_class: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">כחול</SelectItem>
                  <SelectItem value="green">ירוק</SelectItem>
                  <SelectItem value="purple">סגול</SelectItem>
                  <SelectItem value="red">אדום</SelectItem>
                  <SelectItem value="yellow">צהוב</SelectItem>
                  <SelectItem value="indigo">אינדיגו</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAddCategory} className="w-full">
            <Plus className="w-4 h-4 ml-2" />
            הוסף קטגוריה
          </Button>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FolderTree className="w-5 h-5" />
              <span>ניהול קטגוריות ({allCategories.length})</span>
            </CardTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                {showBulkActions ? 'ביטול' : 'פעולות קבוצתיות'}
              </Button>
              {showBulkActions && selectedCategories.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  מחק נבחרות ({selectedCategories.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {allCategories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm"
                        >
                          <div className="flex items-center space-x-3 space-x-reverse flex-1">
                            {showBulkActions && (
                              <Checkbox
                                checked={selectedCategories.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCategories(prev => [...prev, category.id]);
                                  } else {
                                    setSelectedCategories(prev => prev.filter(id => id !== category.id));
                                  }
                                }}
                              />
                            )}
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 space-x-reverse mb-1">
                                <h4 className="font-semibold">{category.name}</h4>
                                <Badge className={colorClasses[category.color_class] || colorClasses.blue}>
                                  {category.color_class}
                                </Badge>
                                {category.parent_id && (
                                  <Badge variant="outline">
                                    תת-קטגוריה
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-mono">{category.slug}</span>
                                {category.description && (
                                  <span className="mr-4">{category.description}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Edit Category Modal */}
      {editingCategory && (
        <Card className="shadow-lg border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Edit className="w-5 h-5" />
              <span>עריכת קטגוריה: {editingCategory.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-name">שם הקטגוריה</Label>
                <Input
                  id="edit-category-name"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category-slug">Slug</Label>
                <Input
                  id="edit-category-slug"
                  value={editingCategory.slug}
                  onChange={(e) => setEditingCategory(prev => ({ ...prev, slug: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category-description">תיאור</Label>
              <Textarea
                id="edit-category-description"
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-parent-category">קטגורית אב</Label>
                <Select 
                  value={editingCategory.parent_id || ''} 
                  onValueChange={(value) => setEditingCategory(prev => ({ ...prev, parent_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגורית אב" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>ללא קטגורית אב</SelectItem>
                    {mainCategories
                      .filter(cat => cat.id !== editingCategory.id)
                      .map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-color-class">צבע</Label>
                <Select 
                  value={editingCategory.color_class} 
                  onValueChange={(value) => setEditingCategory(prev => ({ ...prev, color_class: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">כחול</SelectItem>
                    <SelectItem value="green">ירוק</SelectItem>
                    <SelectItem value="purple">סגול</SelectItem>
                    <SelectItem value="red">אדום</SelectItem>
                    <SelectItem value="yellow">צהוב</SelectItem>
                    <SelectItem value="indigo">אינדיגו</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 space-x-reverse">
              <Button variant="outline" onClick={() => setEditingCategory(null)}>
                ביטול
              </Button>
              <Button onClick={handleUpdateCategory}>
                <Check className="w-4 h-4 ml-2" />
                שמור שינויים
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}