import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // חישוב היום הראשון של החודש ומספר הימים
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = (firstDayOfMonth.getDay() + 1) % 7; // התאמה לשבוע עברי
  const daysInMonth = lastDayOfMonth.getDate();

  // יצירת מערך הימים
  const days = [];
  
  // ימים ריקים בתחילת החודש
  for (let i = 0; i < firstDayWeekday; i++) {
    days.push(null);
  }
  
  // ימי החודש
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (day) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  return (
    <div className="mb-8">
      {/* כותרת */}
      <div className="bg-blue-600 text-white py-3 px-4 rounded-t-lg relative">
        <div className="absolute top-0 right-0 bg-blue-800 text-white px-3 py-1 rounded-bl-lg text-sm font-bold">
          לוח אירועים
        </div>
        <div className="flex items-center justify-between mt-4">
          <button 
            onClick={() => navigateMonth(-1)}
            className="text-white hover:text-blue-200 transition-colors p-1"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <h3 className="text-lg font-bold">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button 
            onClick={() => navigateMonth(1)}
            className="text-white hover:text-blue-200 transition-colors p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* לוח השנה */}
      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg">
        {/* שורת ימי השבוע */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {dayNames.map((day, index) => (
            <div 
              key={index} 
              className="p-2 text-center font-bold text-gray-700 bg-gray-50 border-l border-gray-200 first:border-l-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* שורות התאריכים */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`
                h-10 border-l border-b border-gray-200 first:border-l-0 
                flex items-center justify-center text-sm
                ${day ? 'hover:bg-gray-50 cursor-pointer' : ''}
                ${isToday(day) ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'}
                ${!day ? 'bg-gray-50' : ''}
              `}
            >
              {day || ''}
            </div>
          ))}
        </div>

        {/* פוטר עם מידע נוסף */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-600">
            {isToday(today.getDate()) && currentMonth === today.getMonth() && currentYear === today.getFullYear()
              ? `היום: ${today.getDate()} ${monthNames[today.getMonth()]}`
              : `היום: ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`
            }
          </p>
        </div>
      </div>
    </div>
  );
}