
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, MousePointer } from "lucide-react";

export default function AdList({ ads, onEdit, onDelete }) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>המודעות שלי</CardTitle>
      </CardHeader>
      <CardContent>
        {ads.length === 0 ? (
          <p className="text-center text-gray-500 py-8">עדיין לא יצרת מודעות.</p>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <Card key={ad.id} className="flex flex-col md:flex-row items-start p-4 gap-4">
                <img src={ad.image_url} alt={ad.title} className="w-full md:w-32 h-auto object-contain border" />
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">{ad.title}</h3>
                     <Badge variant={ad.active ? "default" : "secondary"}>{ad.active ? "פעיל" : "מושבת"}</Badge>
                  </div>
                  <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 truncate block">{ad.link_url}</a>
                  <div className="flex items-center space-x-6 space-x-reverse text-sm text-gray-600 mt-2 border-t pt-2">
                    <div className="flex items-center space-x-1 space-x-reverse"><Eye className="w-4 h-4" /><span>{ad.impressions || 0} חשיפות</span></div>
                    <div className="flex items-center space-x-1 space-x-reverse"><MousePointer className="w-4 h-4" /><span>{ad.clicks || 0} קליקים</span></div>
                    <span>מיקום: {ad.position}</span>
                     <span>גודל: {ad.size}</span>
                  </div>
                </div>
                <div className="flex space-x-2 space-x-reverse self-start md:self-center">
                  <Button variant="outline" size="icon" onClick={() => onEdit(ad)}><Edit className="w-4 h-4"/></Button>
                  <Button variant="destructive" size="icon" onClick={() => onDelete(ad.id)}><Trash2 className="w-4 h-4"/></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
