import { useState } from 'react';
import { PlayCircle } from 'lucide-react';

export default function YouTubeFacade({ videoId, title }) {
  const [showVideo, setShowVideo] = useState(false);

  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  if (showVideo) {
    return (
      <div className="relative aspect-video">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div 
      className="relative aspect-video cursor-pointer group bg-black"
      onClick={() => setShowVideo(true)}
    >
      <img 
        src={thumbnailUrl} 
        alt={`תמונה ממוזערת עבור ${title}`}
        className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-black bg-opacity-50 rounded-full p-2 transition-transform group-hover:scale-110">
          <PlayCircle className="w-16 h-16 text-white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <h3 className="text-white text-sm font-semibold">{title}</h3>
      </div>
    </div>
  );
}