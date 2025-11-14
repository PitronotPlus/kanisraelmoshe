import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Users, UserCheck } from "lucide-react";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const [allUsers, pending] = await Promise.all([
        User.list('-created_date'),
        User.filter({ status: 'pending' }, '-created_date')
      ]);
      
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
      if (action === 'approve') {
        const user = pendingUsers.find(u => u.id === userId);
        await User.update(userId, {
          status: 'approved',
          role: user.requested_role
        });
      } else if (action === 'reject') {
        await User.update(userId, {
          status: 'rejected'
        });
      }
      
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'מנהל',
      editor: 'עורך',
      advertiser: 'מפרסם', 
      speaker: 'דובר',
      pending: 'ממתין לאישור'
    };
    return labels[role] || role;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 space-x-reverse">
        <div className="bg-blue-100 p-3 rounded-xl">
          <Users className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים</h1>
          <p className="text-gray-600">נהל הרשאות ואשר בקשות חדשות</p>
        </div>
      </div>

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
                <p className="text-gray-500">אין בקשות ממתינות</p>
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
                        <Badge variant="outline">{getRoleLabel(user.requested_role)}</Badge>
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
                    <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
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
                    <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}