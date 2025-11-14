import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function AdBanner({ ads }) {
  if (!ads || ads.length === 0) {
    return null;
  }

  const ad = ads[0]; // Show first ad

  const handleClick = () => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
      // Here you would also increment clicks count
    }
  };

  const getAdSize = () => {
    switch (ad.size) {
      case 'banner':
        return 'w-full h-24 md:h-32';
      case 'square':
        return 'w-64 h-64';
      case 'rectangle':
        return 'w-full h-48';
      case 'mobile':
        return 'w-full h-20';
      default:
        return 'w-full h-32';
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="relative group cursor-pointer" onClick={handleClick}>
        <img 
          src={ad.image_url || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=200&fit=crop"} 
          alt={ad.title}
          className={`${getAdSize()} object-cover group-hover:scale-105 transition-transform duration-300`}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white rounded-full p-2">
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </div>
          </div>
        </div>
        
        {/* Ad Label */}
        <div className="absolute top-2 left-2 bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          פרסומת
        </div>
        
        {/* Ad Info */}
        <div className="absolute bottom-2 right-2 left-2">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-2">
            <p className="text-sm font-medium text-gray-900 truncate">{ad.title}</p>
            <p className="text-xs text-gray-600 truncate">{ad.advertiser_name}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}