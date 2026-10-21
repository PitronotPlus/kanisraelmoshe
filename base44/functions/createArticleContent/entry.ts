import { createClient } from 'npm:@base44/sdk@0.1.0';
import OpenAI from 'npm:openai'; // שימוש ב-SDK הרשמי

const BATCH_SIZE = 5; // עיבוד 5 מאמרים בכל פעם

Deno.serve(async (req) => {
    // אתחול הלקוחות בתוך המטפל כדי להבטיח ניקיון בין קריאות
    const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

    try {
        // 1. אימות משתמש
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ success: false, message: 'Admin access required' }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        // 2. בדיקת מפתח ה-API של OpenAI
        const openaiKey = Deno.env.get('OpenAi_API_KEY') || Deno.env.get('OPENAI_API_KEY');
        if (!openaiKey) {
            return new Response(JSON.stringify({ success: false, message: 'מפתח OpenAI API לא נמצא ב-Secrets.' }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const openai = new OpenAI({ apiKey: openaiKey });

        // 3. מציאת מאמרים לעדכון
        const allArticles = await base44.entities.Article.list();
        const articlesToUpdate = allArticles.filter(a => (a.content?.replace(/<[^>]*>/g, '').length || 0) < 400);

        if (articlesToUpdate.length === 0) {
            return new Response(JSON.stringify({ success: true, message: "כל המאמרים כבר מעודכנים עם תוכן מפורט." }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        // 4. עיבוד האצווה
        const batch = articlesToUpdate.slice(0, BATCH_SIZE);
        let updatedCount = 0;
        let errorCount = 0;
        let firstErrorMessage = null;

        for (const article of batch) {
            try {
                const completion = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'You are a professional Israeli news editor. Write detailed, factual, and engaging articles in Hebrew.' },
                        { role: 'user', content: `Write a comprehensive news article of about 500 words on the topic: "${article.title}". Ensure a clear structure and a rich language. Return the content in HTML format with <p> and <strong> tags.` }
                    ],
                });

                const newContent = completion.choices[0].message.content;
                if (newContent) {
                    await base44.entities.Article.update(article.id, { content: newContent });
                    updatedCount++;
                } else {
                    throw new Error("OpenAI returned empty content.");
                }

            } catch (e) {
                console.error(`Failed to process article ${article.id}:`, e.message);
                if (!firstErrorMessage) firstErrorMessage = e.message;
                errorCount++;
            }
        }
        
        // 5. החזרת משוב למשתמש
        const remaining = articlesToUpdate.length - updatedCount;
        let message = `אצווה עובדה. ${updatedCount} מאמרים עודכנו, ${errorCount} שגיאות.`;
        if (remaining > 0) {
            message += ` נותרו ${remaining} מאמרים. לחץ שוב כדי להמשיך.`;
        } else {
            message += ` כל המאמרים עודכנו!`;
        }
        if (firstErrorMessage) {
            message += `\nשגיאה ראשונה: ${firstErrorMessage}`;
        }

        return new Response(JSON.stringify({ success: true, message: message }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (e) {
        console.error("Critical function error:", e);
        return new Response(JSON.stringify({ success: false, message: `שגיאה קריטית בפונקציה: ${e.message}` }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});