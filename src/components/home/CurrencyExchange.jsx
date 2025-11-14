import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw } from 'lucide-react';

export default function CurrencyExchange() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const currencies = [
    { code: 'USD', name: 'דולר ארה״ב', flag: '🇺🇸' },
    { code: 'EUR', name: 'אירו', flag: '🇪🇺' },
    { code: 'GBP', name: 'ליש״ט', flag: '🇬🇧' },
    { code: 'CHF', name: 'פרנק שוויצרי', flag: '🇨🇭' },
    { code: 'CAD', name: 'דולר קנדי', flag: '🇨🇦' },
    { code: 'AUD', name: 'דולר אוסטרלי', flag: '🇦🇺' },
    { code: 'JPY', name: 'ין יפני', flag: '🇯🇵' },
    { code: 'CNY', name: 'יואן סיני', flag: '🇨🇳' }
  ];

  const symbols = currencies.map(c => c.code);

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = `https://api.frankfurter.app/latest?from=ILS&to=${symbols.join(',')}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const formattedRates = currencies.map(currency => {
        const rateFromILS = data.rates[currency.code];
        return {
          ...currency,
          fromILS: rateFromILS ? rateFromILS.toFixed(4) : 'N/A',
          toILS: rateFromILS ? (1 / rateFromILS).toFixed(4) : 'N/A'
        };
      });
      
      setRates(formattedRates);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError('שגיאה בטעינת שערי החליפין');
      setRates(currencies.map(currency => ({ ...currency, fromILS: 'N/A', toILS: 'N/A' })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
    // רענון כל 30 דקות
    const interval = setInterval(fetchExchangeRates, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className="mb-8">
      <div className="bg-blue-600 text-white py-3 px-4 rounded-t-lg relative">
        <div className="absolute top-0 right-0 bg-blue-800 text-white px-3 py-1 rounded-bl-lg text-sm font-bold">
          שערי חליפין
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">שערים יציגים</span>
          </div>
          <button 
            onClick={fetchExchangeRates}
            disabled={loading}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg">
        {/* כותרות */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 border-b text-xs font-semibold text-gray-700">
          <div className="text-right">מטבע</div>
          <div className="text-center">שער</div>
          <div className="text-center">₪ למטבע</div>
        </div>

        {/* שורות המטבעות */}
        <div className="divide-y divide-gray-100">
          {rates.map((currency) => (
            <div key={currency.code} className="grid grid-cols-3 gap-2 p-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="text-lg">{currency.flag}</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{currency.code}</div>
                  <div className="text-xs text-gray-500 leading-tight">{currency.name}</div>
                </div>
              </div>
              <div className="text-center text-sm font-mono text-gray-800 flex items-center justify-center">
                {currency.toILS}
              </div>
              <div className="text-center text-sm font-mono text-gray-800 flex items-center justify-center">
                {(1 / parseFloat(currency.fromILS)).toFixed(4)}
              </div>
            </div>
          ))}
        </div>

        {/* פוטר */}
        <div className="p-3 bg-gray-50 border-t text-center">
          <p className="text-xs text-gray-500">
            {error ? error : `עודכן לאחרונה: ${lastUpdate.toLocaleTimeString('he-IL')}`}
            <br/>
            השערים באדיבות Frankfurter.app
          </p>
        </div>
      </div>
    </div>
  );
}