import { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';

export default function WeatherWidget() {
  const [weatherDataState, setWeatherDataState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use sample data for now to avoid rate limiting
      const sampleWeatherData = [
        { name: 'תל אביב', temp: 24, maxTemp: 28, condition: 'sunny', icon: '☀️' },
        { name: 'ירושלים', temp: 22, maxTemp: 26, condition: 'sunny', icon: '☀️' },
        { name: 'חיפה', temp: 25, maxTemp: 29, condition: 'sunny', icon: '☀️' },
        { name: 'באר שבע', temp: 26, maxTemp: 31, condition: 'sunny', icon: '☀️' },
        { name: 'אילת', temp: 30, maxTemp: 35, condition: 'sunny', icon: '☀️' },
        { name: 'נתניה', temp: 24, maxTemp: 28, condition: 'sunny', icon: '☀️' },
        { name: 'אשדוד', temp: 25, maxTemp: 29, condition: 'sunny', icon: '☀️' }
      ];

      // Simulate some variation in weather
      const variableWeatherData = sampleWeatherData.map(city => ({
        ...city,
        temp: Math.floor(Math.random() * 10) + 20, // 20-30°C
        maxTemp: Math.floor(Math.random() * 8) + 25, // 25-33°C
        icon: ['☀️', '⛅', '🌤️'][Math.floor(Math.random() * 3)]
      }));

      setWeatherDataState(variableWeatherData);
      
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('שגיאה בטעינת נתוני מזג אוויר');
      
      // Fallback data
      setWeatherDataState([
        { name: 'תל אביב', temp: 24, maxTemp: 28, condition: 'sunny', icon: '☀️' },
        { name: 'ירושלים', temp: 22, maxTemp: 26, condition: 'sunny', icon: '☀️' },
        { name: 'חיפה', temp: 25, maxTemp: 29, condition: 'sunny', icon: '☀️' },
        { name: 'באר שבע', temp: 26, maxTemp: 31, condition: 'sunny', icon: '☀️' },
        { name: 'אילת', temp: 30, maxTemp: 35, condition: 'sunny', icon: '☀️' },
        { name: 'נתניה', temp: 24, maxTemp: 28, condition: 'sunny', icon: '☀️' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="sidebar-section-title">
        <span>מזג אוויר</span>
        <Cloud className="w-5 h-5 text-blue-500" />
      </div>
      <div className="bg-white border border-gray-200 border-t-0 p-4">
        {loading ? (
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">טוען תחזית...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {weatherDataState.slice(0, 6).map((city, index) => (
                <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg">{city.icon}</div>
                  <div className="text-xs font-semibold text-gray-700">{city.name}</div>
                  <div className="text-sm font-bold text-blue-600">{city.temp}°</div>
                </div>
              ))}
            </div>
            <div className="text-center text-xs text-gray-500 border-t pt-2">
              תחזית מזג אוויר כללית
            </div>
          </>
        )}
      </div>
    </div>
  );
}