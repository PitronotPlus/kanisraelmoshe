import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

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
      {/* כפתור כותרת עליון */}
      <div className="bg-[#1e4d8b] text-white py-2 px-4 rounded-t-lg">
        <div className="text-center text-sm font-bold">לוח אירועים</div>
      </div>

      {/* כותרת עם חודש ושנה - רקע אדום */}
      <div className="bg-white border-x border-gray-300">
        <div className="flex items-center justify-between px-4 py-2 bg-[#c00000]">
          <button 
            onClick={() => navigateMonth(-1)}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <h3 className="text-base font-bold text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          
          <button 
            onClick={() => navigateMonth(1)}
            className="text-white hover:text-gray-200 transition-colors p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* שורת ימי השבוע */}
        <div className="grid grid-cols-7 border-t border-gray-300">
          {dayNames.map((day, index) => (
            <div 
              key={index} 
              className="p-2 text-center font-bold text-[#1e4d8b] bg-white border-l border-gray-300 last:border-l-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* שורות התאריכים */}
        <div className="grid grid-cols-7 border-t border-gray-300">
          {days.map((day, index) => (
            <div 
              key={index} 
              className={`
                h-10 border-l border-b border-gray-300 last:border-l-0
                flex items-center justify-center text-sm font-medium
                ${day ? 'hover:bg-gray-50 cursor-pointer' : ''}
                ${isToday(day) ? 'bg-[#1e4d8b] text-white font-bold' : day ? 'text-gray-900 bg-white' : 'bg-white'}
              `}
            >
              {day || ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}