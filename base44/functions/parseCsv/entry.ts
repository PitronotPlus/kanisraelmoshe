import { parse } from 'https://deno.land/std@0.224.0/csv/parse.ts';

Deno.serve(async (req) => {
    try {
        const { file_url } = await req.json();

        if (!file_url) {
            return new Response(JSON.stringify({ success: false, message: 'file_url is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const response = await fetch(file_url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const csvContent = await response.text();
        
        if (!csvContent.trim()) {
            return new Response(JSON.stringify({ success: false, message: 'הקובץ ריק.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const records = parse(csvContent, {
            trimLeadingSpace: true,
        });

        if (records.length < 2) {
             return new Response(JSON.stringify({ success: false, message: 'קובץ ה-CSV חייב להכיל שורת כותרת ולפחות שורת נתונים אחת.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        const headers = records[0];
        const jsonData = records.slice(1).map(row => {
            const obj = {};
            headers.forEach((header, i) => {
                obj[header.trim()] = row[i];
            });
            return obj;
        });

        return new Response(JSON.stringify({ success: true, data: jsonData, headers: headers }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: `שגיאה בפענוח הקובץ: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});