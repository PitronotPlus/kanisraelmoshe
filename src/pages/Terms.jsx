import { FileText, AlertCircle, Users, Ban, Scale, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="bg-blue-100 p-3 rounded-xl inline-block mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">תקנון השימוש</h1>
        <p className="text-gray-600 mt-2">עדכון אחרון: {new Date().toLocaleDateString('he-IL')}</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>מבוא</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p>
              ברוכים הבאים לאתר "כאן ישראל". תקנון זה קובע את תנאי השימוש באתר ובשירותים הניתנים בו.
              השימוש באתר מהווה הסכמה מלאה לתנאים המפורטים להלן.
            </p>
            <p>
              האתר מיועד לקריאת חדשות, מאמרי דעה ותוכן מידעתי. משתמשים יכולים להירשם כמפרסמים או דוברים 
              בכפוף לאישור המערכת.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="w-5 h-5 text-green-600" />
              <span>הגדרות וסוגי משתמשים</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">סוגי משתמשים:</h3>
              <ul className="list-disc pr-6 space-y-2">
                <li><strong>קורא:</strong> כל מבקר באתר שאינו נדרש להירשם</li>
                <li><strong>מפרסם:</strong> גורם העוסק בפרסום מודעות באתר (לאחר אישור)</li>
                <li><strong>דובר/כותב:</strong> יוצר תוכן המפרסם מאמרים באתר (לאחר אישור)</li>
                <li><strong>מנהל:</strong> בעל האתר או נציג המערכת</li>
              </ul>
            </div>
            <p>
              ההרשמה כמפרסם או דובר כרוכה בתהליך אישור על ידי המערכת. 
              האתר שומר לעצמו את הזכות לדחות בקשות ללא מתן הסברים.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>כללי שימוש נכון</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p>משתמשי האתר מתחייבים:</p>
            <ul className="list-disc pr-6 space-y-2">
              <li>להשתמש באתר למטרות חוקיות בלבד</li>
              <li>לכבד את זכויות יוצרים ולא להעתיק תוכן ללא הרשאה</li>
              <li>לא לפרסם תוכן פוגעני, מסית או פוגע בכבוד הזולת</li>
              <li>לא לנסות לחדור למערכות האתר או לפגוע בפעילותו</li>
              <li>לספק מידע נכון ומעודכן בעת הרשמה</li>
              <li>לא לשתף פרטי גישה עם אחרים</li>
              <li>לעדכן את המערכת על שינויים בפרטים האישיים</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Ban className="w-5 h-5 text-red-600" />
              <span>פעילויות אסורות</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <p className="font-semibold text-red-600">אסור בהחלט:</p>
            <ul className="list-disc pr-6 space-y-2">
              <li>פרסום תוכן הכולל הסתה, גזענות או אלימות</li>
              <li>פרסום מידע כוזב או מטעה</li>
              <li>פרסום תוכן פורנוגרפי או לא מתאים</li>
              <li>פגיעה בפרטיות של אנשים פרטיים</li>
              <li>פרסום ספאם או תוכן פרסומי לא מורשה</li>
              <li>ניסיון לעקוף מערכות האבטחה</li>
              <li>יצירת חשבונות מזויפים או מרובים</li>
              <li>שימוש באתר לפעילות עברוניות</li>
            </ul>
            <p className="text-red-600 font-semibold">
              הפרת כללים אלו עלולה להוביל לחסימת החשבון ופניה לרשויות החוק.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <FileText className="w-5 h-5 text-purple-600" />
              <span>תוכן ומאמרים</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">לדוברים וכותבים:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>התוכן שאתם יוצרים הופך לרכושו של האתר</li>
                <li>האתר רשאי לערוך, לקצר או לשנות את התוכן</li>
                <li>יש לוודא שהתוכן מקורי ואינו מפר זכויות יוצרים</li>
                <li>התוכן צריך להיות איכותי ורלוונטי לקהל היעד</li>
                <li>האתר רשאי לדחות או להסיר תוכן שאינו עומד בקריטריונים</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">זכויות יוצרים:</h3>
              <p>
                כל התוכן באתר מוגן בזכויות יוצרים. שימוש או העתקה ללא רשות מהווים הפרה. 
                במקרה של תלונה על הפרת זכויות יוצרים, פנו ל: kanisraelnews@gmail.com
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>מפרסמים ומודעות</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">למפרסמים:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>המודעות כפופות לאישור המערכת</li>
                <li>האתר רשאי לדחות מודעות שאינן מתאימות</li>
                <li>התשלום מתבצע מראש והוא אינו מוחזר</li>
                <li>המפרסם אחראי לתוכן המודעה ולחוקיותה</li>
                <li>האתר אינו אחראי לתוצאות הפרסום</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">מודעות אסורות:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>מוצרים או שירותים לא חוקיים</li>
                <li>תוכן מיני או לא מתאים</li>
                <li>הימורים וכספי ברירת מחדל</li>
                <li>רפואה אלטרנטיבית ללא הכשרה</li>
                <li>מוצרים מסוכנים או מזויפים</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Scale className="w-5 h-5 text-blue-600" />
              <span>אחריות והגבלות</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">אחריות האתר:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>האתר פועל "כמו שהוא" ללא התחייבות לזמינות מלאה</li>
                <li>איננו אחראים לנזקים הנגרמים משימוש באתר</li>
                <li>איננו אחראים לתוכן שיוצרים המשתמשים</li>
                <li>איננו אחראים לקישורים לאתרים חיצוניים</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">אחריות המשתמש:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>המשתמש אחראי לכל פעילות בחשבונו</li>
                <li>המשתמש מתחייב לפצות את האתר על נזקים שגרם</li>
                <li>השימוש באתר הוא באחריות המשתמש בלבד</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>שינויים בתקנון וביטול חשבון</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">שינויים בתקנון:</h3>
              <p>
                האתר רשאי לשנות את התקנון בכל עת. שינויים משמעותיים יפורסמו באתר. 
                המשך השימוש מהווה הסכמה לשינויים.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">ביטול חשבון:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>המשתמש רשאי לבטל את חשבונו בכל עת</li>
                <li>האתר רשאי לבטל חשבונות בגין הפרת התקנון</li>
                <li>בעת ביטול החשבון, התוכן עשוי להישאר באתר</li>
                <li>תקציבים שלא נוצלו לא יוחזרו (למפרסמים)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Mail className="w-5 h-5 text-green-600" />
              <span>יצירת קשר והליכים</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">ליצירת קשר:</h3>
              <p><strong>אימייל:</strong> kanisraelnews@gmail.com</p>
              <p><strong>נושאים:</strong> תלונות, שאלות, בקשות למחיקת תוכן</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">הליכי תלונות:</h3>
              <ul className="list-disc pr-6 space-y-1">
                <li>תלונות יטופלו תוך 7 ימי עסקים</li>
                <li>יש לפרט את הבעיה ולצרף ראיות</li>
                <li>החלטת המערכת הינה סופית</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">חוק וסמכות שיפוט:</h3>
              <p>
                התקנון כפוף לחוקי מדינת ישראל. 
                סמכות השיפוט נתונה לבתי המשפט בישראל.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}