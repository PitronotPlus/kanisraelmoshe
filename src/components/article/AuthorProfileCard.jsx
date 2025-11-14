import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Linkedin, Twitter, Facebook, Instagram, Youtube, Globe } from 'lucide-react';

const socialIcons = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  website: Globe
};

export default function AuthorProfileCard({ user }) {
  if (!user || !user.display_name) return null;

  const initials = user.display_name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
    
  const hasSocialLinks = user.social_links && Object.values(user.social_links).some(link => link);

  return (
    <div className="border-t pt-8 mt-8">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h3 className="text-lg font-bold bg-gray-800 text-white px-3 py-1 -mt-1">אודות הכותב</h3>
        <div className="flex items-center gap-2">
            {hasSocialLinks && Object.entries(user.social_links).map(([key, value]) => {
                if (!value) return null;
                const Icon = socialIcons[key];
                return (
                    <a key={key} href={value} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-800">
                        <Icon className="w-5 h-5" />
                    </a>
                );
            })}
            {user.id && (
              <Link to={createPageUrl(`Search?author_id=${user.id}`)}>
                <Button variant="outline" size="sm">כל הפוסטים</Button>
              </Link>
            )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar className="h-24 w-24 border-2 border-white shadow-md flex-shrink-0">
          {user.profile_image_url && (
            <AvatarImage src={user.profile_image_url} alt={user.display_name} />
          )}
          <AvatarFallback className="text-2xl font-semibold">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h4 className="font-bold text-xl mb-2">{user.display_name}</h4>
          {user.bio && (
            <p className="text-gray-700 leading-relaxed">{user.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}