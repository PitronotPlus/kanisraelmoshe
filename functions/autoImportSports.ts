import { createClient } from 'npm:@base44/sdk@0.1.0';
import OpenAI from 'npm:openai';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

// הפונקציה הראשית שרצה כל 3 שעות
Deno.cron("Auto import sports news", "0 */3 * * *", async () => {
    console.log("Starting automatic sports news import...");
    
    try {
        // 1. בדיקת מפתח API
        const openaiKey = Deno.env.get('OpenAi_API_KEY') || Deno.env.get('OPENAI_API_KEY');
        if (!openaiKey) {
            console.error('OpenAI API key not found - skipping import');
            return;
        }
        const openai = new OpenAI({ apiKey: openaiKey });

        // 2. משיכת מבזקים מה-RSS
        const rssResponse = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.one.co.il/rss/');
        if (!rssResponse.ok) {
            console.error('Failed to fetch RSS feed:', rssResponse.statusText);
            return;
        }
        
        const rssData = await rssResponse.json();
        if (rssData.status !== 'ok' || !rssData.items) {
            console.error('Invalid RSS data received');
            return;
        }
        
        // 3. מניעת כפילויות
        const existingArticles = await base44.entities.Article.list();
        const existingUrls = new Set(existingArticles.map(a => a.original_source_url));
        
        const newItems = rssData.items.filter(item => !existingUrls.has(item.link));
        if (newItems.length === 0) {
            console.log("No new sports news to import - all up to date");
            return;
        }

        console.log(`Found ${newItems.length} new sports items to process`);
        
        const articlesToCreate = [];
        let processedCount = 0;

        // 4. עיבוד מבזקים חדשים (מקסימום 8 בכל פעם כדי לא להעמיס על המערכת)
        for (const item of newItems.slice(0, 8)) { 
            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'אתה עורך חדשות ספורט ישראלי מקצועי. שכתב את התקציר הבא למאמר חדשות קצר, מקורי ומרתק בן 3-4 פסקאות. שמור על העובדות המרכזיות אבל השתמש במילים משלך. החזר את התוכן בפורמט HTML פשוט עם תגיות <p> ו-<strong>. הקפד על שפה עברית תקינה וסגנון עיתונאי מקצועי.' 
                        },
                        { 
                            role: 'user', 
                            content: `נושא: "${item.title}". תקציר מקורי: "${item.description.replace(/<[^>]*>/g, '')}"` 
                        }
                    ],
                });
                
                const newContent = completion.choices[0].message.content;
                const slug = item.title.toLowerCase()
                    .replace(/[^\u0590-\u05FF\w\s-]/g, '') // Remove special chars but keep Hebrew
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-') // Replace multiple hyphens with single
                    .substring(0, 60); // Limit slug length

                articlesToCreate.push({
                    title: item.title,
                    slug: slug,
                    content: newContent,
                    excerpt: item.description.replace(/<[^>]*>/g, '').substring(0, 180) + '...',
                    category: 'ספורט',
                    published: true,
                    author: 'מערכת ספורט',
                    original_source_url: item.link,
                    text_direction: 'rtl',
                    tags: ['ספורט', 'מבזקים']
                });
                processedCount++;
                
                // הוספת עיכוב קטן בין בקשות כדי לא להעמיס על OpenAI
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (e) {
                console.error(`Failed to process article "${item.title}":`, e.message);
            }
        }
        
        // 5. יצירת המאמרים במערכת
        if (articlesToCreate.length > 0) {
            await base44.entities.Article.bulkCreate(articlesToCreate);
            console.log(`Successfully imported ${processedCount} new sports articles`);
        } else {
            console.log("No articles were successfully processed");
        }

    } catch (e) {
        console.error("Auto import failed:", e.message);
    }
});

// עבור קריאות ידניות (אם צריך)
Deno.serve(async (req) => {
    return new Response(JSON.stringify({ 
        message: "Sports auto-import is running as a cron job every 3 hours",
        next_run: "Check logs for import status"
    }), { 
        status: 200, 
        headers: { "Content-Type": "application/json" } 
    });
});