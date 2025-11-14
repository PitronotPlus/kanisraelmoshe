
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const FallbackAd = ({ size = 'banner' }) => {
  // Special tiny version for the header
  if (size === 'header') {
    return (
      <div className="h-full w-full">
        <Card className="h-full overflow-hidden shadow-md border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-2 text-center transition-all duration-300 hover:border-blue-400">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="bg-blue-100 p-2 rounded-full inline-block">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-blue-800 leading-tight">העסק שלך יכול להופיע כאן!</h3>
              <Link to={createPageUrl("Advertisers")}>
                <span className="text-blue-600 text-xs hover:underline">פרסם עכשיו »</span>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Default fallback for all other sizes - FIXED HEIGHT
  return (
    <div className="w-full h-32"> {/* Fixed container height instead of h-full */}
      <Card className="h-full overflow-hidden shadow-lg border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4 transition-all duration-300 hover:border-blue-400 hover:shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4 text-center sm:text-right">
          {/* Left part: icon and text */}
          <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full inline-block transition-transform hover:scale-110 flex-shrink-0">
                  <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                  <h3 className="text-md sm:text-lg font-bold text-blue-800 mb-1 leading-tight">
                      העסק שלך יכול להופיע כאן!
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-600">
                      הגע לאלפי קוראים פוטנציאליים
                  </p>
              </div>
          </div>

          {/* Right part: button */}
          <Link to={createPageUrl("Advertisers")} className="flex-shrink-0">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-shadow">
                  <ExternalLink className="w-4 h-4 ml-2" />
                  פרסם עכשיו
              </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

const PaidAd = ({ ad }) => {
  const handleClick = () => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
      // Here you would also increment clicks count via an API call
    }
  };

  return (
    <Card 
      className="h-full w-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative h-full w-full">
        <img 
          src={ad.image_url} 
          alt={ad.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-md">
          פרסומת
        </div>
      </div>
    </Card>
  );
};

export default function SmartAdBanner({ ads = [], position, size }) {
  // If the size is 'header', always show the fallback placeholder, even if a paid ad exists.
  if (size === 'header') {
    return <FallbackAd size="header" />;
  }

  const relevantAd = ads.find(ad => ad.position === position && ad.active);
  
  if (relevantAd) {
    return <PaidAd ad={relevantAd} />;
  }
  
  return <FallbackAd size={size} />;
}
