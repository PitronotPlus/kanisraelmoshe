import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID') });

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response('Unauthorized', { status: 401 });

        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const user = await base44.auth.me();
        if (user.role !== 'admin') {
            return new Response(JSON.stringify({ success: false, message: "Admin access required." }), { status: 403, headers: { "Content-Type": "application/json" } });
        }

        const articlesToUpdate = await base44.entities.Article.filter({ author: 'כתב כאן ישראל' });
        
        if (articlesToUpdate.length === 0) {
            return new Response(JSON.stringify({ success: true, message: 'No articles needed an update.' }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        let updatedCount = 0;
        let failedCount = 0;

        for (const article of articlesToUpdate) {
            try {
                await base44.entities.Article.update(article.id, { created_by: 'kanisraelnews@gmail.com' });
                updatedCount++;
            } catch (e) {
                failedCount++;
            }
             // A minimal delay to be safe
            await new Promise(resolve => setTimeout(resolve, 20));
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Migration complete. Updated: ${updatedCount}, Failed: ${failedCount}.`,
            details: { totalFound: articlesToUpdate.length, updated: updatedCount, errors: failedCount }
        }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error) {
        console.error("Migration script failed:", error.message);
        return new Response(JSON.stringify({ success: false, message: `An unexpected server error occurred: ${error.message}` }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
});