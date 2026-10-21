import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        const base44 = createClientFromRequest(req);

        // Pre-warm frequently accessed data
        const startTime = Date.now();
        
        const [
            latestArticles,
            categories,
            advertisements,
            siteConfig,
            menu
        ] = await Promise.all([
            base44.asServiceRole.entities.Article.list('-created_date', 50), // Latest 50 articles
            base44.asServiceRole.entities.Category.list(),
            base44.asServiceRole.entities.Advertisement.filter({ active: true }),
            base44.asServiceRole.entities.SiteConfig.list(),
            base44.asServiceRole.entities.NavigationMenu.filter({ name: 'main_menu' })
        ]);

        const duration = Date.now() - startTime;

        const response = {
            success: true,
            message: 'Cache warmed up successfully',
            stats: {
                articles: latestArticles.length,
                categories: categories.length,
                ads: advertisements.length,
                config: siteConfig.length,
                menu: menu.length,
                duration: `${duration}ms`
            },
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Error warming up cache:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
});