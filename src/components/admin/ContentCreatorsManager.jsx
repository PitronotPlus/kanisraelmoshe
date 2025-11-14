
import { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Article } from '@/entities/Article';
import { Category } from '@/entities/Category'; // Added Category import
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, ArrowRight, Eye, Edit, ToggleLeft, ToggleRight, CheckCircle2, Lock } from 'lucide-react'; // Added Lock icon
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { groupBy, sumBy } from 'lodash';
import CreatorPermissionsModal from './CreatorPermissionsModal'; // Added CreatorPermissionsModal import

// Main component for managing content creators
export default function ContentCreatorsManager() {
  const [creators, setCreators] = useState([]);
  const [allCategories, setAllCategories] = useState([]); // New state for all categories
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [creatorArticles, setCreatorArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // New state for modal visibility
  const [editingCreator, setEditingCreator] = useState(null); // New state for the creator being edited

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [allUsers, allArticles, categoriesData] = await Promise.all([ // Added categoriesData
          User.list('-created_date'),
          Article.filter({}, '-created_date', 5000), // Fetch a large batch of articles for stats
          Category.list('sort_order') // Fetch all categories
        ]);

        setAllCategories(categoriesData); // Set all categories

        const creatorUsers = allUsers.filter(u => u.role === 'admin' || u.app_role === 'speaker' || u.app_role === 'editor');
        const articlesByCreator = groupBy(allArticles, 'author_user_id');

        const creatorsWithStats = creatorUsers.map(creator => {
          const articles = articlesByCreator[creator.id] || [];
          return {
            ...creator,
            articleCount: articles.length,
            totalViews: sumBy(articles, 'views') || 0,
          };
        });

        setCreators(creatorsWithStats);
      } catch (error) {
        console.error("Error loading creators data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleOpenPermissionsModal = (creator) => {
    setEditingCreator(creator);
    setIsModalOpen(true);
  };
  
  const handleSavePermissions = async (creatorId, allowed_categories) => {
    // Optimistic UI update
    setCreators(prev => 
      prev.map(c => c.id === creatorId ? { ...c, allowed_categories } : c)
    );
    try {
      await User.update(creatorId, { allowed_categories });
      setIsModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Failed to update permissions:", error);
      // Revert UI on failure
      setCreators(prev => 
        prev.map(c => c.id === creatorId ? { ...c, allowed_categories: editingCreator.allowed_categories } : c)
      );
      alert('שגיאה בעדכון הרשאות.');
    }
  };

  const handleSelectCreator = async (creator) => {
    setSelectedCreator(creator);
    setLoadingArticles(true);
    try {
      const articles = await Article.filter({ author_user_id: creator.id }, '-created_date', 200);
      setCreatorArticles(articles);
    } catch (error) {
      console.error(`Error fetching articles for ${creator.full_name}:`, error);
      setCreatorArticles([]);
    } finally {
      setLoadingArticles(false);
    }
  };
  
  const handleToggleStatus = async (article, newStatus) => {
    const originalStatus = article.status;
    
    // Optimistic UI update
    setCreatorArticles(prev => 
      prev.map(a => a.id === article.id ? { ...a, status: newStatus } : a)
    );

    try {
      await Article.update(article.id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update article status:", error);
      // Revert on error
      setCreatorArticles(prev => 
        prev.map(a => a.id === article.id ? { ...a, status: originalStatus } : a)
      );
      alert('שגיאה בעדכון סטטוס המאמר.');
    }
  };

  const handleToggleAutoApprove = async (creatorId, newStatus) => {
     setCreators(prev => 
        prev.map(c => c.id === creatorId ? { ...c, auto_approve_posts: newStatus } : c)
     );
     try {
        await User.update(creatorId, { auto_approve_posts: newStatus });
     } catch (error) {
        console.error("Failed to update auto-approve status:", error);
        setCreators(prev => 
            prev.map(c => c.id === creatorId ? { ...c, auto_approve_posts: !newStatus } : c)
        );
        alert('שגיאה בעדכון ההגדרה.');
     }
  };

  const CreatorCard = ({ creator }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow">
          <Avatar>
            <AvatarImage src={creator.profile_image_url} alt={creator.full_name} />
            <AvatarFallback>{creator.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h4 className="font-bold">{creator.full_name}</h4>
            <p className="text-sm text-gray-500">{creator.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-center w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <p className="text-xl font-bold">{creator.articleCount}</p>
            <p className="text-xs text-gray-500">מאמרים</p>
          </div>
          <div className="flex-1 md:flex-initial">
            <p className="text-xl font-bold">{creator.totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500">צפיות</p>
          </div>
          <div className="flex items-center space-x-2 space-x-reverse">
             <Label htmlFor={`auto-approve-${creator.id}`} className="text-xs">אישור אוטומטי</Label>
             <Switch
                id={`auto-approve-${creator.id}`}
                checked={creator.auto_approve_posts}
                onCheckedChange={(checked) => handleToggleAutoApprove(creator.id, checked)}
             />
          </div>
          <Button variant="outline" size="sm" onClick={() => handleOpenPermissionsModal(creator)}>
            <Lock className="w-4 h-4 ml-1" /> {/* Added Lock icon */}
            הרשאות
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSelectCreator(creator)}>
            נהל תוכן
            <ArrowRight className="w-4 h-4 mr-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const getStatusBadge = (status) => {
    switch (status) {
        case 'published':
            return <Badge variant="default">פורסם</Badge>;
        case 'draft':
            return <Badge variant="secondary">טיוטה</Badge>;
        case 'pending_approval':
            return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">ממתין לאישור</Badge>;
        default:
            return <Badge variant="destructive">{status}</Badge>;
    }
  };

  const CreatorArticlesView = () => (
    <div>
      <Button variant="ghost" onClick={() => setSelectedCreator(null)} className="mb-4">
        &larr; חזור לרשימת הכותבים
      </Button>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={selectedCreator.profile_image_url} />
              <AvatarFallback>{selectedCreator.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>מאמרים מאת {selectedCreator.full_name}</CardTitle>
              <CardDescription>ניהול כל המאמרים שנוצרו על ידי {selectedCreator.app_role || selectedCreator.role}.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingArticles ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>כותרת</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                  <TableHead>צפיות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatorArticles.map(article => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">{article.title}</TableCell>
                    <TableCell>
                      {getStatusBadge(article.status)}
                    </TableCell>
                    <TableCell>{format(new Date(article.created_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                    <TableCell>{article.views || 0}</TableCell>
                    <TableCell className="flex gap-2">
                      {article.status === 'pending_approval' && (
                        <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleToggleStatus(article, 'published')}>
                            <CheckCircle2 className="w-4 h-4 ml-1" /> אשר
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={createPageUrl(`Article?id=${article.id}`)} target="_blank"><Eye className="w-4 h-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={createPageUrl(`Editor?id=${article.id}`)}><Edit className="w-4 h-4" /></Link>
                      </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(article, article.status === 'published' ? 'draft' : 'published')}>
                        {article.status === 'published' ? <ToggleRight className="w-5 h-5 text-green-600" title="הפוך לטיוטה" /> : <ToggleLeft className="w-5 h-5 text-gray-500" title="פרסם"/>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4"> {/* Changed top-level div structure slightly as per outline */}
      {selectedCreator ? (
        <CreatorArticlesView />
      ) : (
        <div className="space-y-4">
          <CardHeader className="px-0"> {/* Removed px-0 to align with CardTitle style if needed */}
            <CardTitle>ניהול כותבים ותוכן</CardTitle> {/* Updated CardTitle */}
            <CardDescription>
              כאן תוכל לנהל את הכותבים באתר, לצפות במאמרים שלהם, לאשר פרסומים ולהגדיר הרשאות. {/* Updated CardDescription */}
            </CardDescription>
          </CardHeader>
          {creators.map(creator => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      )}
      {isModalOpen && (
        <CreatorPermissionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          creator={editingCreator}
          allCategories={allCategories}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
}
