
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Copy, Edit, Save, Upload, X, FilePlus } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function TableGenerator({ isOpen, onClose, onInsert, savedTables, onSaveTable, onDeleteTable, onEditTable, tableToEdit: initialTableData }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [tableName, setTableName] = useState('');
  const [tableId, setTableId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const initializeData = (numRows, numCols) => {
    return Array.from({ length: numRows }, () =>
      Array.from({ length: numCols }, () => ({ text: '', textColor: '#333333' }))
    );
  };

  useEffect(() => {
    if (initialTableData) {
      setTableName(initialTableData.name || '');
      setTableId(initialTableData.id);
      const tableRows = initialTableData.data?.length || 0;
      const tableCols = initialTableData.data?.[0]?.length || 0;
      setRows(tableRows);
      setCols(tableCols);
      setHeaders(initialTableData.headers || Array(tableRows).fill(false));
      
      const properData = initialTableData.data.map(row =>
        row.map(cell => ({
          text: cell?.text || '',
          image: cell?.image || undefined,
          textColor: cell?.textColor || '#333333'
        }))
      );
      setData(properData);
    } else {
      handleNew();
    }
  }, [initialTableData, isOpen]);

  const handleNew = () => {
    setTableName('');
    setTableId(null);
    const newRows = 3, newCols = 3;
    setRows(newRows);
    setCols(newCols);
    setData(initializeData(newRows, newCols));
    setHeaders(Array(newRows).fill(false).map((_, i) => i === 0)); // Default first row as header
  };

  const handleTableStructureChange = (newRows, newCols) => {
    const oldData = [...data];
    const newData = Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols }, (_, c) => {
        if (oldData[r] && oldData[r][c]) {
          return { ...oldData[r][c] };
        }
        return { text: '', textColor: '#333333' };
      })
    );
    setData(newData);

    const newHeaders = Array(newRows).fill(false);
    headers.forEach((h, i) => {
      if (i < newRows) newHeaders[i] = h;
    });
    setHeaders(newHeaders);
  };

  const handleCellChange = (rowIndex, colIndex, field, value) => {
    const newData = data.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) =>
            cIdx === colIndex ? { ...cell, [field]: value } : cell
          )
        : row
    );
    setData(newData);
  };

  const handleImageUpload = async (rowIndex, colIndex, file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      handleCellChange(rowIndex, colIndex, 'image', file_url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('שגיאה בהעלאת התמונה');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (rowIndex, colIndex) => {
    handleCellChange(rowIndex, colIndex, 'image', undefined);
  };

  const handleHeaderToggle = (rowIndex) => {
    const newHeaders = [...headers];
    newHeaders[rowIndex] = !newHeaders[rowIndex];
    setHeaders(newHeaders);
  };

  const handleSave = () => {
    if (!tableName.trim()) {
      alert("אנא הזן שם לטבלה");
      return;
    }
    const currentId = tableId || `table-${Date.now()}`;
    const tableData = {
      id: currentId,
      name: tableName,
      data,
      headers,
    };
    onSaveTable(tableData);
    setTableId(currentId);
    alert('הטבלה נשמרה!');
  };

  const copyShortcode = (id) => {
    const shortcode = `[table id="${id}"]`;
    navigator.clipboard.writeText(shortcode);
    onInsert(shortcode);
    alert(`הקוד הועתק והודבק בעורך: ${shortcode}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>עורך טבלאות</DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>שם הטבלה</Label>
              <Input
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="שם הטבלה (חובה לשמירה)"
              />
            </div>
            <div className="space-y-2">
              <Label>מספר שורות</Label>
              <Input
                type="number" min="1" max="50" value={rows}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setRows(val);
                  handleTableStructureChange(val, cols);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>מספר עמודות</Label>
              <Input
                type="number" min="1" max="10" value={cols}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setCols(val);
                  handleTableStructureChange(rows, val);
                }}
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-auto">
            <table className="w-full">
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b">
                    <td className="w-12 bg-gray-50 text-center py-2 border-l">
                      <Checkbox checked={headers[rowIndex]} onCheckedChange={() => handleHeaderToggle(rowIndex)} title="סמן כשורת כותרת (ישפיע על הדגשה ורקע)" />
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="border-l relative group p-1">
                        <textarea
                          value={cell?.text || ''}
                          onChange={(e) => handleCellChange(rowIndex, colIndex, 'text', e.target.value)}
                          className={`w-full p-2 border-0 resize-none min-h-[60px] text-right focus:ring-1 focus:ring-blue-500 rounded-md ${headers[rowIndex] ? 'font-bold bg-gray-50' : 'bg-white'}`}
                          style={{ color: cell?.textColor || '#333333' }}
                          placeholder="הזן תוכן..."
                        />
                        <input 
                          type="color" 
                          value={cell?.textColor || '#333333'} 
                          onChange={(e) => handleCellChange(rowIndex, colIndex, 'textColor', e.target.value)} 
                          className="w-5 h-5 rounded border cursor-pointer absolute top-2 right-2" 
                          title="בחר צבע טקסט" 
                        />
                        <div className="absolute bottom-1 left-1 flex gap-1">
                           <input type="file" accept="image/*" onChange={(e) => handleImageUpload(rowIndex, colIndex, e.target.files[0])} className="hidden" id={`img-up-${rowIndex}-${colIndex}`} />
                           <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => document.getElementById(`img-up-${rowIndex}-${colIndex}`)?.click()} disabled={isUploading} title="העלה תמונה"><Upload className="w-3 h-3" /></Button>
                        </div>
                        {cell?.image && (
                          <div className="p-1">
                            <div className="relative w-16 h-16">
                              <img src={cell.image} alt="" className="w-full h-full object-cover rounded border" />
                              <button type="button" onClick={() => handleRemoveImage(rowIndex, colIndex)} className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"><X className="w-2.5 h-2.5" /></button>
                            </div>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {savedTables && savedTables.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-medium mb-3">טבלאות שמורות במאמר זה:</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedTables.map(table => (
                  <div key={table.id} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="font-medium">{table.name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyShortcode(table.id)}><Copy className="w-4 h-4 ml-1" />הוסף לכתבה</Button>
                      <Button variant="outline" size="sm" onClick={() => onEditTable(table)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="sm" onClick={() => onDeleteTable(table.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="pt-4 border-t">
          <div className='flex justify-between w-full'>
            <Button variant="outline" onClick={onClose}>סגור</Button>
            <div className='flex gap-2'>
                <Button variant="secondary" onClick={handleNew}>
                  <FilePlus className="w-4 h-4 ml-2" />
                  צור טבלה חדשה
                </Button>
                <Button onClick={handleSave} disabled={!tableName.trim()}>
                  <Save className="w-4 h-4 ml-2" />
                  {tableId ? 'עדכן טבלה קיימת' : 'שמור טבלה חדשה'}
                </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
