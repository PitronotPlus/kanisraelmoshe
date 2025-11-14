import { Shield, Eye, Lock, UserCheck, Mail, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="bg-blue-100 p-3 rounded-xl inline-block mb-4">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">מדיניות פרטיות</h1>
        <p className="text-gray-600 mt-2">עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <span>מבוא</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p>
              באתר "כאן ישראל" אנו מכבדים את פרטיותכם ומתחייבים לשמור על המידע האישי שלכם. 
              מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם.
            </p>
            <p>
              השימוש באתר מהווה הסכמה למדיניות פרטיות זו. אם אינכם מסכימים לתנאים, 
              אנא הימנעו משימוש באתר.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Eye className="w-5 h-5 text-green-600" />
              <span>איזה מידע אנו אוספים</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">מידע שאתם מספקים:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>שם מלא וכתובת אימייל (בעת הרשמה)</li>
                <li>מספר טלפון (למפרסמים ודוברים)</li>
                <li>פרטי החברה (למפרסמים)</li>
                <li>תיאור אישי ותחומי התמחות (לדוברים)</li>
                <li>תוכן שאתם יוצרים או משתפים</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">מידע טכני:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>כתובת IP</li>
                <li>סוג דפדפן ומערכת הפעלה</li>
                <li>דפים שביקרתם באתר</li>
                <li>זמן ותאריך הביקור</li>
                <li>עוגיות (Cookies) לשיפור החוויה</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Lock className="w-5 h-5 text-purple-600" />
              <span>כיצד אנו משתמשים במידע</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <ul className="list-disc pr-6 space-y-2">
              <li>מתן השירותים המבוקשים (קריאת תוכן, פרסום מודעות, כתיבת מאמרים)</li>
              <li>יצירת קשר עמכם לגבי השירות או התוכן</li>
              <li>שיפור האתר וההתאמה לצרכיכם</li>
              <li>שליחת עדכונים רלוונטיים (רק למי שביקש זאת)</li>
              <li>אבטחת האתר ומניעת שימוש לרעה</li>
              <li>ניתוח סטטיסטי לשיפור השירות</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Shield className="w-5 h-5 text-red-600" />
              <span>הגנה על המידע</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p>
              אנו נוקטים באמצעי אבטחה מתקדמים להגנת המידע שלכם:
            </p>
            <ul className="list-disc pr-6 space-y-1">
              <li>הצפנת נתונים רגישים</li>
              <li>גישה מוגבלת למידע רק לצוות המורשה</li>
              <li>גיבויים קבועים ואחסון מאובטח</li>
              <li>ניטור רציף לזיהוי פעילות חשודה</li>
              <li>עדכונים שוטפים של מערכות האבטחה</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Mail className="w-5 h-5 text-orange-600" />
              <span>שיתוף מידע עם צדדים שלישיים</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p className="font-semibold text-red-600">
              אנו לא מוכרים או משתפים את המידע האישי שלכם עם צדדים שלישיים למטרות מסחריות.
            </p>
            <p>המידע עשוי להיחשף רק במקרים הבאים:</p>
            <ul className="list-disc pr-6 space-y-1">
              <li>בהסכמתכם המפורשת</li>
              <li>לצורכי אכיפת חוק או הליכים משפטיים</li>
              <li>לספקי שירות טכניים (תחת התחייבויות פרטיות מחמירות)</li>
              <li>במקרה של מכירת האתר (עם הודעה מוקדמת)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              <span>הזכויות שלכם</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p>יש לכם הזכות:</p>
            <ul className="list-disc pr-6 space-y-1">
              <li>לדעת איזה מידע יש לנו עליכם</li>
              <li>לבקש תיקון מידע שגוי</li>
              <li>לבקש מחיקת החשבון והמידע</li>
              <li>להתנגד לעיבוד המידע לצרכים מסוימים</li>
              <li>לקבל העתק של המידע שלכם</li>
              <li>לבטל הסכמה בכל עת</li>
            </ul>
            <p className="mt-4">
              לממש זכויות אלו, צרו קשר: <strong>kanisraelnews@gmail.com</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>עוגיות (Cookies)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p>האתר משתמש בעוגיות לשיפור החוויה:</p>
            <ul className="list-disc pr-6 space-y-1">
              <li><strong>עוגיות חיוניות:</strong> נדרשות לפעילות האתר</li>
              <li><strong>עוגיות ביצועים:</strong> עוזרות לנו להבין כיצד משתמשים באתר</li>
              <li><strong>עוגיות פרסום:</strong> להצגת מודעות רלוונטיות</li>
            </ul>
            <p>ניתן לנהל העדפות עוגיות בהגדרות הדפדפן שלכם.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>צור קשר</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>לשאלות או בקשות בנושא פרטיות:</p>
            <div className="mt-4">
              <p><strong>אימייל:</strong> kanisraelnews@gmail.com</p>
              <p><strong>נושא:</strong> מדיניות פרטיות - [פרטי הפנייה]</p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              אנו נשיב תוך 7 ימי עסקים מיום קבלת הפנייה.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}