import { createClient } from 'npm:@base44/sdk@0.1.0';
import OpenAI from 'npm:openai';

Deno.serve(async (req) => {
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

    try {
        // 1. אימות משתמש
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Unauthorized');
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') throw new Error('Admin access required');

        // 2. בדיקת מפתח API
        const openaiKey = Deno.env.get('OpenAi_API_KEY') || Deno.env.get('OPENAI_API_KEY');
        if (!openaiKey) throw new Error('מפתח OpenAI API לא נמצא ב-Secrets.');
        const openai = new OpenAI({ apiKey: openaiKey });

        // 3. משיכת מבזקים מה-RSS
        const rssResponse = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.one.co.il/rss/');
        if (!rssResponse.ok) throw new Error('Failed to fetch RSS feed');
        const rssData = await rssResponse.json();
        if (rssData.status !== 'ok' || !rssData.items) throw new Error('Invalid RSS data received');
        
        // 4. מניעת כפילויות
        const existingArticles = await base44.entities.Article.list();
        const existingUrls = new Set(existingArticles.map(a => a.original_source_url));
        
        const newItems = rssData.items.filter(item => !existingUrls.has(item.link));
        if (newItems.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "אין מבזקים חדשים לייבא. הכל מעודכן." }), { status: 200 });
        }

        const articlesToCreate = [];
        let rewriteCount = 0;

        // 5. שכתוב ועיבוד כל מבזק חדש
        for (const item of newItems.slice(0, 10)) { // Process up to 10 new items at a time
            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'אתה עורך חדשות ספורט ישראלי. שכתב את התקציר הבא למאמר חדשות קצר, מקורי ומרתק בן 3-4 פסקאות. שמור על העובדות המרכזיות אבל השתמש במילים משלך. החזר את התוכן בפורמט HTML פשוט עם תגיות <p> ו-<strong>.' },
                        { role: 'user', content: `נושא: "${item.title}". תקציר מקורי: "${item.description.replace(/<[^>]*>/g, '')}"` }
                    ],
                });
                
                const newContent = completion.choices[0].message.content;
                const slug = item.title.replace(/\s+/g, '-').replace(/[^\w-]/g, '');

                articlesToCreate.push({
                    title: item.title,
                    slug: slug,
                    content: newContent,
                    excerpt: item.description.replace(/<[^>]*>/g, '').substring(0, 200),
                    category: 'ספורט',
                    published: true,
                    author: 'מערכת ספורט',
                    original_source_url: item.link,
                    text_direction: 'rtl',
                });
                rewriteCount++;
            } catch (e) {
                console.error(`שגיאה בשכתוב מאמר "${item.title}":`, e.message);
            }
        }
        
        // 6. יצירת המאמרים במערכת
        if (articlesToCreate.length > 0) {
            await base44.entities.Article.bulkCreate(articlesToCreate);
        }

        const message = `הייבוא הושלם! ${rewriteCount} מאמרים חדשים נוספו. ${newItems.length - rewriteCount} נתקלו בשגיאת שכתוב.`;
        return new Response(JSON.stringify({ success: true, message }), { status: 200 });

    } catch (e) {
        console.error("Critical function error:", e);
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
});