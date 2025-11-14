import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DEFAULT_VIDEO_URL = "https://base44.app/api/apps/68701c57df55f5f96aeb5a04/files/public/68701c57df55f5f96aeb5a04/70cf2044e_BANNER.mp4";

const DefaultVideoAd = ({ size = 'banner' }) => {
  // Special tiny version for the header
  if (size === 'header') {
    return (
      <div className="h-full w-full overflow-hidden">
        <video 
          src={DEFAULT_VIDEO_URL}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Default video for all other sizes
  return (
    <div className="w-full h-32 overflow-hidden rounded-lg">
      <video 
        src={DEFAULT_VIDEO_URL}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const PaidAd = ({ ad }) => {
  const handleClick = () => {
    if (ad.link_url) {
      window.open(ad.link_url, '_blank');
    }
  };

  // HTML/Embed ad
  if (ad.content_type === 'html' && ad.html_code) {
    return (
      <div 
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: ad.html_code }}
      />
    );
  }

  // Video ad
  if (ad.content_type === 'video' && ad.video_url) {
    return (
      <div 
        className="w-full h-full overflow-hidden rounded-lg cursor-pointer"
        onClick={handleClick}
      >
        <video 
          src={ad.video_url}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Image ad
  if (ad.content_type === 'image' && ad.image_url) {
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
  }

  // Fallback if ad has no valid content
  return <DefaultVideoAd size={ad.size} />;
};

export default function SmartAdBanner({ ads = [], position, size }) {
  const relevantAd = ads.find(ad => ad.position === position && ad.active);
  
  if (relevantAd) {
    return <PaidAd ad={relevantAd} />;
  }
  
  // Default: show video
  return <DefaultVideoAd size={size} />;
}