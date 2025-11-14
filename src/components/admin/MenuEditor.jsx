
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { NavigationMenu } from '@/entities/NavigationMenu';
import { Category } from '@/entities/Category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Plus, Trash2, Edit, Save, Link as LinkIcon, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const MENU_NAME = 'main_menu';

// Function to convert flat list to a tree for rendering
const buildTree = (items, parentId = null) => {
  return items
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(item => ({ ...item, children: buildTree(items, item.id) }));
};

const MenuItem = ({ item, onUpdate, onDelete, level = 0, dragHandleProps }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(item.label);

  const handleUpdate = () => {
    onUpdate(item.id, { label });
    setIsEditing(false);
  };

  const getItemIcon = () => {
    if (item.type === 'category') return <Tag className="w-4 h-4 text-purple-500" />;
    if (item.type === 'parent') return <Tag className="w-4 h-4 text-gray-500" />;
    return <LinkIcon className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className="bg-white p-2 rounded-md border flex items-center justify-between" style={{ paddingRight: `${level * 20}px` }}>
      <div className="flex items-center gap-2">
        <span {...dragHandleProps}>
            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
        </span>
        {getItemIcon()}
        {isEditing ? (
          <Input value={label} onChange={e => setLabel(e.target.value)} className="h-8" />
        ) : (
          <span className={item.type === 'parent' ? 'font-semibold text-gray-700' : ''}>
            {item.label}
            {item.type === 'parent' && <span className="text-xs text-gray-500 mr-2">(לא לחיץ)</span>}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isEditing ? (
          <Button size="sm" onClick={handleUpdate}>שמור</Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

const DraggableMenuItem = ({ item, index, onUpdate, onDelete, level }) => {
    return (
        <Draggable draggableId={item.id} index={index}>
            {(provided) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mb-2"
                >
                    <MenuItem 
                        item={item} 
                        onUpdate={onUpdate} 
                        onDelete={onDelete} 
                        level={level}
                        dragHandleProps={provided.dragHandleProps}
                    />
                    <Droppable droppableId={item.id} type="menu-item">
                        {(droppableProvided, droppableSnapshot) => (
                            <div
                                ref={droppableProvided.innerRef}
                                {...droppableProvided.droppableProps}
                                className={`ml-5 pt-2 pl-2 space-y-2 rounded-md ${droppableSnapshot.isDraggingOver ? 'bg-blue-100' : ''}`}
                                style={{ minHeight: droppableSnapshot.isDraggingOver ? '50px' : '10px' }}
                            >
                                {item.children && item.children.map((child, childIndex) => (
                                    <DraggableMenuItem 
                                        key={child.id}
                                        item={child}
                                        index={childIndex}
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                        level={level + 1}
                                    />
                                ))}
                                {droppableProvided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            )}
        </Draggable>
    );
};


const MenuEditor = () => {
  const [menuId, setMenuId] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for adding new items
  const [newItemType, setNewItemType] = useState('category');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [newItemParentId, setNewItemParentId] = useState(null);
  const [categorySearch, setCategorySearch] = useState(''); // Add search state

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const [menuData, categoriesData] = await Promise.all([
        NavigationMenu.filter({ name: MENU_NAME }),
        Category.list()
      ]);

      if (menuData.length > 0) {
        setMenuId(menuData[0].id);
        setItems(menuData[0].items || []);
      } else {
        // If no menu, create one with default items from top-level categories
        const defaultItems = categoriesData
          .filter(c => !c.parent_id)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((c, index) => ({
            id: c.id,
            label: c.name,
            type: 'category',
            slug: c.slug,
            parentId: null,
            order: index
          }));
        const newMenu = await NavigationMenu.create({ name: MENU_NAME, items: defaultItems });
        setMenuId(newMenu.id);
        setItems(defaultItems);
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading menu:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const handleSaveMenu = async () => {
    setSaving(true);
    try {
      if (menuId) {
        await NavigationMenu.update(menuId, { items });
      } else {
        const newMenu = await NavigationMenu.create({ name: MENU_NAME, items });
        setMenuId(newMenu.id);
      }
      alert('התפריט נשמר בהצלחה!');
    } catch (error) {
      console.error("Error saving menu:", error);
      alert('שגיאה בשמירת התפריט.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = () => {
    const parentId = newItemParentId === 'root' ? null : newItemParentId; // Determine parentId
    const newOrder = items.filter(i => i.parentId === parentId).length; // Calculate order within parent
    let newItem;

    if (newItemType === 'category' && selectedCategory) {
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) return;
      // Check if category already exists at the target level
      if (items.some(item => item.id === category.id && item.parentId === parentId)) {
        alert('קטגוריה זו כבר קיימת ברמה הנבחרת.');
        return;
      }
      newItem = {
        id: category.id, // Use category id as item id for uniqueness
        label: category.name,
        type: 'category',
        slug: category.slug,
        parentId: parentId, // Assign parentId
        order: newOrder
      };
    } else if (newItemType === 'custom' && customLabel && customUrl) {
      newItem = {
        id: `custom_${Date.now()}`,
        label: customLabel,
        type: 'custom',
        url: customUrl,
        parentId: parentId, // Assign parentId
        order: newOrder
      };
    } else if (newItemType === 'parent' && customLabel) {
      // New parent item type
      newItem = {
        id: `parent_${Date.now()}`,
        label: customLabel,
        type: 'parent',
        parentId: parentId,
        order: newOrder
      };
    } else {
      return;
    }

    setItems([...items, newItem]);
    // Reset form
    setSelectedCategory('');
    setCustomLabel('');
    setCustomUrl('');
    setNewItemParentId(null); // Reset parent ID selection
    setCategorySearch(''); // Reset category search
  };

  const updateItem = (itemId, updates) => {
    setItems(items.map(item => item.id === itemId ? { ...item, ...updates } : item));
  };

  const deleteItem = (itemId) => {
    // Also delete all children
    const itemsToDelete = [itemId];
    const findChildren = (parentId) => {
      const children = items.filter(i => i.parentId === parentId);
      children.forEach(child => {
        itemsToDelete.push(child.id);
        findChildren(child.id);
      });
    };
    findChildren(itemId);

    setItems(items.filter(item => !itemsToDelete.includes(item.id)));
  };

  // Helper function to check if a potentialParentId is a descendant of childId
  const isDescendant = (childId, potentialParentId, allItems) => {
      let currentItem = allItems.find(item => item.id === potentialParentId);
      while (currentItem) {
          if (currentItem.id === childId) {
              return true;
          }
          currentItem = allItems.find(item => item.id === currentItem.parentId);
      }
      return false;
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return; // No change
    }

    let updatedItems = Array.from(items);

    const draggedItem = updatedItems.find(item => item.id === draggableId);
    if (!draggedItem) return;

    const sourceParentId = source.droppableId === 'root' ? null : source.droppableId;
    const destinationParentId = destination.droppableId === 'root' ? null : destination.droppableId;
    
    // Prevent dropping an item into itself or its own descendant
    if (draggedItem.id === destinationParentId || isDescendant(draggedItem.id, destinationParentId, updatedItems)) {
        console.warn("Invalid drop operation: Cannot drop item into itself or its descendant.");
        return;
    }

    // Step 1: Remove the dragged item from its original position
    // First, find and remove the dragged item from the `updatedItems` array to keep it truly updated
    updatedItems = updatedItems.filter(item => item.id !== draggableId);

    // Filter items belonging to the source parent, excluding the dragged item (already removed)
    const sourceList = updatedItems.filter(item => item.parentId === sourceParentId).sort((a,b) => a.order - b.order);

    // Step 2: Add the dragged item to its new position in the destination list
    // Filter items belonging to the destination parent
    const destinationList = updatedItems.filter(item => item.parentId === destinationParentId).sort((a,b) => a.order - b.order);
    
    // Set the new parentId for the dragged item
    draggedItem.parentId = destinationParentId;
    // Insert the dragged item into the destination list at the correct index
    destinationList.splice(destination.index, 0, draggedItem);
    
    // Step 3: Re-calculate the order for both source and destination lists
    sourceList.forEach((item, index) => {
        item.order = index;
    });
    destinationList.forEach((item, index) => {
        item.order = index;
    });

    // Step 4: Reconstruct the full list of items
    // Get all items that are not part of the source or destination lists (they remain unaffected)
    const unaffectedItems = updatedItems.filter(
        item => item.parentId !== sourceParentId && item.parentId !== destinationParentId
    );
    
    // Combine all lists
    setItems([...unaffectedItems, ...sourceList, ...destinationList]);
  };
  
  // Filter categories based on search
  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
    (c.slug && c.slug.toLowerCase().includes(categorySearch.toLowerCase()))
  );

  if (loading) return <div>טוען עורך תפריטים...</div>;

  const menuTree = buildTree(items);
  
  // Helper to flatten menu tree for parent selection dropdown
  const getMenuOptions = (items, prefix = '') => {
    let options = [];
    for (const item of items) {
        options.push({ id: item.id, indentedLabel: `${prefix}${item.label}` }); // Only include necessary props
        if (item.children && item.children.length > 0) {
            options = options.concat(getMenuOptions(item.children, `${prefix}-- `));
        }
    }
    return options;
  };

  const flatMenuOptions = getMenuOptions(menuTree);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Add new item form */}
      <div className="md:col-span-1 space-y-6">
        <Card>
          <CardHeader><CardTitle>הוספת פריט לתפריט</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Select value={newItemType} onValueChange={setNewItemType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="category">קטגוריה</SelectItem>
                <SelectItem value="parent">כותרת אב (לא לחיצה)</SelectItem>
                <SelectItem value="custom">קישור מותאם</SelectItem>
              </SelectContent>
            </Select>

            {newItemType === 'category' && (
              <div className="space-y-2">
                <Input
                  placeholder="חפש קטגוריה..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="mb-2"
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                  <SelectContent>
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value={null} disabled>לא נמצאו קטגוריות</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {newItemType === 'parent' && (
              <div className="space-y-2">
                <Input 
                  placeholder="שם כותרת האב (לדוגמה: ראשי, ספורט, כלכלה)" 
                  value={customLabel} 
                  onChange={e => setCustomLabel(e.target.value)} 
                />
                <p className="text-xs text-gray-500">
                  כותרת אב שאינה לחיצה, משמשת לארגון פריטי תפריט
                </p>
              </div>
            )}

            {newItemType === 'custom' && (
              <div className="space-y-2">
                <Input placeholder="תווית הקישור" value={customLabel} onChange={e => setCustomLabel(e.target.value)} />
                <Input placeholder="URL הקישור" value={customUrl} onChange={e => setCustomUrl(e.target.value)} dir="ltr" />
              </div>
            )}

            <div>
              <Label>פריט אב (אופציונלי)</Label>
              <Select value={newItemParentId} onValueChange={setNewItemParentId}>
                  <SelectTrigger>
                      <SelectValue placeholder="ללא (רמה עליונה)" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value={null}>ללא (רמה עליונה)</SelectItem>
                      {flatMenuOptions.map(option => (
                          <SelectItem key={option.id} value={option.id}>
                              {option.indentedLabel}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>

            <Button onClick={handleAddItem} className="w-full">
              <Plus className="w-4 h-4 ml-2" />
              הוסף פריט
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>שמירת שינויים</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4">לאחר שסיימת לערוך, לחץ על הכפתור כדי לשמור את מבנה התפריט החדש.</p>
                <Button onClick={handleSaveMenu} disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 ml-2" />
                  {saving ? 'שומר...' : 'שמור תפריט'}
                </Button>
            </CardContent>
        </Card>
      </div>

      {/* Menu structure editor */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader><CardTitle>מבנה התפריט הראשי</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">גרור פריטים כדי לסדר אותם מחדש, או גרור פריט לתוך פריט אחר כדי ליצור תת-תפריט.</p>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="root" type="menu-item">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-2 p-2 rounded-lg ${snapshot.isDraggingOver ? 'bg-blue-100' : ''}`}
                  >
                    {menuTree.map((item, index) => (
                      <DraggableMenuItem
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={updateItem}
                        onDelete={deleteItem}
                        level={0}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenuEditor;
