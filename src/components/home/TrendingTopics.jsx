import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Hash } from "lucide-react";

export default function TrendingTopics() {
  const trendingTopics = [
    { name: "בחירות 2024", count: 156 },
    { name: "כלכלה ישראלית", count: 89 },
    { name: "היטק", count: 67 },
    { name: "ספורט", count: 45 },
    { name: "חדשות בינלאומיות", count: 34 },
    { name: "מזג אוויר", count: 28 },
    { name: "תרבות", count: 23 },
    { name: "בריאות", count: 19 }
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 space-x-reverse">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <span>נושאים חמים</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingTopics.map((topic, index) => (
            <div key={topic.name} className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{index + 1}</span>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Hash className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {topic.count}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}