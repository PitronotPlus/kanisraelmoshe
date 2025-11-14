import { useState, useEffect } from "react";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function AdminUsers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await User.me();
        if (user && user.role === 'admin') {
          setCurrentUser(user);
          const allUsers = await User.list('-created_date');
          setUsers(allUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const updateUserRole = async (userId, newRole) => {
    try {
      await User.update(userId, { app_role: newRole, status: 'approved' });
      const updatedUsers = await User.list('-created_date');
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('שגיאה בעדכון המשתמש');
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      await User.update(userId, { status: newStatus });
      const updatedUsers = await User.list('-created_date');
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('שגיאה בעדכון הסטטוס');
    }
  };

  const getRoleBadge = (role, appRole) => {
    if (role === 'admin') {
      return <Badge className="bg-red-500">מנהל</Badge>;
    }
    if (appRole === 'speaker') {
      return <Badge className="bg-blue-500">דובר</Badge>;
    }
    if (appRole === 'advertiser') {
      return <Badge className="bg-green-500">מפרסם</Badge>;
    }
    return <Badge variant="secondary">משתמש רגיל</Badge>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 ml-1" />מאושר</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 ml-1" />נדחה</Badge>;
      default:
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 ml-1" />ממתין לאישור</Badge>;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.app_role === filterRole || (filterRole === "admin" && user.role === "admin");
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">טוען משתמשים...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">אין הרשאה</h2>
          <p className="text-gray-600">אין לך הרשאות לצפות בדף זה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים</h1>
            <p className="text-gray-600">נהל הרשאות ואישורים של משתמשים</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="חיפוש לפי שם או אימייל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="סנן לפי תפקיד" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל התפקידים</SelectItem>
            <SelectItem value="admin">מנהל</SelectItem>
            <SelectItem value="speaker">דובר</SelectItem>
            <SelectItem value="advertiser">מפרסם</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>רשימת משתמשים ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם מלא</TableHead>
                <TableHead>אימייל</TableHead>
                <TableHead>תפקיד</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead>תאריך הרשמה</TableHead>
                <TableHead>פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role, user.app_role)}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>{format(new Date(user.created_date), 'dd/MM/yyyy', { locale: he })}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.role !== 'admin' && (
                        <Select
                          value={user.app_role || "user"}
                          onValueChange={(value) => updateUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">משתמש רגיל</SelectItem>
                            <SelectItem value="speaker">דובר</SelectItem>
                            <SelectItem value="advertiser">מפרסם</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      {user.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            אשר
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateUserStatus(user.id, 'rejected')}
                          >
                            דחה
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}