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

        // Fetch all layout data
        const [menuResult, adsData, configData] = await Promise.all([
            base44.asServiceRole.entities.NavigationMenu.filter({ name: 'main_menu' }),
            base44.asServiceRole.entities.Advertisement.filter({ active: true }),
            base44.asServiceRole.entities.SiteConfig.list()
        ]);

        const response = {
            success: true,
            message: 'Layout cache refreshed successfully',
            data: {
                menu: menuResult[0]?.items || [],
                ads: adsData,
                config: configData[0] || null,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: corsHeaders
        });

    } catch (error) {
        console.error('Error refreshing layout cache:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
});