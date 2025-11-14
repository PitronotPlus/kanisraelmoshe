
import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Article } from "@/entities/Article";
import { Advertisement } from "@/entities/Advertisement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Eye, UserCheck, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import UserProfileEditor from "./UserProfileEditor";

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  // New states for content transfer on user deletion
  const [deletingUser, setDeletingUser] = useState(null);
  const [userContent, setUserContent] = useState({ articles: [], ads: [] });
  const [selectedTransferUser, setSelectedTransferUser] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Removed: [isUpdatingAuthors, setIsUpdatingAuthors] = useState(false);
  // Removed: [updateResult, setUpdateResult] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await User.list('-created_date');
      
      const pending = allUsers.filter(u => 
        u.role !== 'admin' && 
        u.status !== 'approved' && 
        u.status !== 'rejected'
      );
      
      setUsers(allUsers);
      setPendingUsers(pending);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      let updatedUser;
      if (action === 'approve') {
        updatedUser = await User.update(userId, {
          status: 'approved',
          role: 'user',
          app_role: user.requested_app_role,
        });
      } else if (action === 'reject') {
        updatedUser = await User.update(userId, {
          status: 'rejected'
        });
      }
      
      // Immediately update state
      if (updatedUser) {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setPendingUsers(prev => prev.filter(u => u.id !== updatedUser.id)); // Remove from pending
      }
      
      loadUsers(); // Re-load to ensure full consistency, although local state is updated
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    try {
      const userToDelete = users.find(u => u.id === userId);
      if (!userToDelete) {
        console.error('User not found for deletion:', userId);
        return;
      }

      // Check if user has any content
      const [userArticles, userAds] = await Promise.all([
        Article.filter({ created_by: userToDelete.email }),
        Advertisement.filter({ created_by: userToDelete.email })
      ]);

      if (userArticles.length > 0 || userAds.length > 0) {
        // User has content, show transfer dialog
        setDeletingUser({ id: userId, name: userName, email: userToDelete.email });
        setUserContent({ articles: userArticles, ads: userAds });
        setSelectedTransferUser('');
      } else {
        // User has no content, proceed with simple deletion
        if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש "${userName}"? פעולה זו אינה הפיכה.`)) {
          await User.delete(userId);
          loadUsers();
          alert('המשתמש נמחק בהצלחה');
        }
      }
    } catch (error) {
      console.error('Error checking user content or deleting user:', error);
      alert('שגיאה בבדיקת תכני המשתמש או במחיקתו');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser || !selectedTransferUser) return;
    
    setIsDeleting(true);
    try {
      // Transfer content if a user is selected
      if (selectedTransferUser && selectedTransferUser !== 'delete') {
        const transferToUser = users.find(u => u.id === selectedTransferUser);
        if (transferToUser) {
          // Transfer articles
          for (const article of userContent.articles) {
            await Article.update(article.id, {
              created_by: transferToUser.email,
              author: transferToUser.full_name
            });
          }
          
          // Transfer advertisements
          for (const ad of userContent.ads) {
            await Advertisement.update(ad.id, {
              created_by: transferToUser.email,
              advertiser_name: transferToUser.full_name,
              advertiser_email: transferToUser.email
            });
          }
        }
      } else if (selectedTransferUser === 'delete') {
        // Delete all content
        for (const article of userContent.articles) {
          await Article.delete(article.id);
        }
        for (const ad of userContent.ads) {
          await Advertisement.delete(ad.id);
        }
      }

      // Delete the user
      await User.delete(deletingUser.id);
      
      setDeletingUser(null);
      setUserContent({ articles: [], ads: [] });
      setSelectedTransferUser('');
      loadUsers();
      alert('המשתמש נמחק בהצלחה');
    } catch (error) {
      console.error('Error deleting user or transferring content:', error);
      alert('שגיאה במחיקת המשתמש או העברת תכנים');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingUser(null);
    setUserContent({ articles: [], ads: [] });
    setSelectedTransferUser('');
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleSaveUser = (updatedUser) => {
    // Update the local state immediately for instant feedback
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setPendingUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setEditingUser(null); // Close the modal
  };

  // Removed: Direct migration function without external dependency (handleUpdateArticleAuthors)

  const getRoleLabel = (user) => {
    const labels = {
      admin: 'מנהל',
      editor: 'עורך',
      advertiser: 'מפרסם',
      speaker: 'דובר/כותב',
    };
    
    if (user.role === 'admin') return labels.admin;
    if (user.status === 'approved' && user.app_role) return labels[user.app_role] || user.app_role;
    if (user.status === 'pending' && user.requested_app_role) return `ממתין (${labels[user.requested_app_role] || user.requested_app_role})`;
    if (!user.status && user.requested_app_role) return `ממתין (${labels[user.requested_app_role] || user.requested_app_role})`;
    
    return 'משתמש';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { variant: 'default', label: 'מאושר' },
      pending: { variant: 'secondary', label: 'ממתין' },
      rejected: { variant: 'destructive', label: 'נדחה' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const availableUsers = users.filter(u => 
    u.id !== deletingUser?.id && 
    (u.role === 'admin' || u.status === 'approved')
  ).sort((a, b) => a.full_name.localeCompare(b.full_name));

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8" dir="rtl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">ניהול משתמשים</h2>
          <div className="flex gap-3">
            <Button onClick={() => setShowAddUser(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              הוסף משתמש
            </Button>
          </div>
        </div>

        {/* Removed: updateResult rendering */}

        {/* Delete User Dialog */}
        {deletingUser && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardHeader>
              <CardTitle className="text-red-800">מחיקת משתמש - {deletingUser.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">תכנים של המשתמש:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  {userContent.articles.length > 0 && (
                    <li>• {userContent.articles.length} מאמרים</li>
                  )}
                  {userContent.ads.length > 0 && (
                    <li>• {userContent.ads.length} מודעות</li>
                  )}
                  {userContent.articles.length === 0 && userContent.ads.length === 0 && (
                    <li>אין תכנים למשתמש זה.</li>
                  )}
                </ul>
              </div>

              {(userContent.articles.length > 0 || userContent.ads.length > 0) && (
                <div className="space-y-2">
                  <Label htmlFor="transfer-action">מה לעשות עם התכנים?</Label>
                  <Select value={selectedTransferUser} onValueChange={setSelectedTransferUser}>
                    <SelectTrigger id="transfer-action">
                      <SelectValue placeholder="בחר פעולה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">מחק את כל התכנים</SelectItem>
                      {availableUsers.length > 0 ? (
                        availableUsers.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            העבר ל-{user.full_name} ({user.email})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-other-users" disabled>
                          אין משתמשים אחרים להעביר אליהם
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex space-x-2 space-x-reverse">
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || (userContent.articles.length > 0 || userContent.ads.length > 0) && !selectedTransferUser}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      מוחק...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 ml-2" />
                      אשר מחיקה
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting}>
                  ביטול
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {editingUser && (
          <UserProfileEditor
            user={editingUser}
            onSave={handleSaveUser}
            onCancel={() => setEditingUser(null)}
          />
        )}
        
        {showAddUser && (
          <UserProfileEditor
            user={null}
            onSave={(newUser) => { 
              setShowAddUser(false); 
              // For new user, re-load all users to ensure it's displayed and categorized correctly
              // or handle immediate addition if its status is known and can be added to existing lists
              loadUsers(); 
              alert('המשתמש נוסף בהצלחה.'); 
            }}
            onCancel={() => setShowAddUser(false)}
          />
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">בקשות ממתינות ({pendingUsers.length})</TabsTrigger>
            <TabsTrigger value="approved">משתמשים מאושרים</TabsTrigger>
            <TabsTrigger value="all">כל המשתמשים</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingUsers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold">אין בקשות חדשות</h3>
                  <p className="text-gray-500 mt-1">כאשר משתמשים חדשים יירשמו, בקשות האישור שלהם יופיעו כאן.</p>
                </CardContent>
              </Card>
            ) : (
              pendingUsers.map((user) => (
                <Card key={user.id} className="shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 space-x-reverse mb-4">
                          <h3 className="text-lg font-semibold">{user.full_name}</h3>
                          {getStatusBadge(user.status)}
                          <Badge variant="outline">{getRoleLabel(user)}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div><strong>אימייל:</strong> {user.email}</div>
                          <div><strong>טלפון:</strong> {user.phone}</div>
                          {user.company && <div><strong>חברה:</strong> {user.company}</div>}
                          {user.bio && <div className="md:col-span-2"><strong>תיאור:</strong> {user.bio}</div>}
                          {user.expertise && user.expertise.length > 0 && (
                            <div className="md:col-span-2">
                              <strong>התמחויות:</strong> {user.expertise.join(', ')}
                            </div>
                          )}
                          {user.portfolio_url && (
                            <div className="md:col-span-2">
                              <strong>תיק עבודות:</strong> 
                              <a href={user.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mr-2">
                                צפה בתיק
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'approve')}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="w-4 h-4 ml-2" />
                          אשר
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'reject')}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 ml-2" />
                          דחה
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.full_name)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          מחק
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {users.filter(u => u.status === 'approved').map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(user.status)}
                      <Badge variant="outline">{getRoleLabel(user)}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(user.status)}
                      <Badge variant="outline">{getRoleLabel(user)}</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
