import { createClient } from 'npm:@base44/sdk@0.1.0';

Deno.serve(async (req) => {
    const base44 = createClient({
        appId: Deno.env.get('BASE44_APP_ID'),
    });

    try {
        const { query } = await req.json();
        if (!query) {
            return new Response(JSON.stringify({ error: 'Query parameter is required' }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        const BATCH_SIZE = 250; // Batch size to control memory usage
        let offset = 0;
        let hasMore = true;
        const searchResults = [];
        const searchLower = query.toLowerCase();

        // Process articles in batches to avoid hitting memory limits
        while(hasMore) {
            const batch = await base44.entities.Article.filter(
                { published: true }, 
                '-created_date', 
                BATCH_SIZE, 
                offset
            );
            
            if (batch.length === 0) {
                hasMore = false;
            } else {
                // Filter within the current batch and add matches to the results array
                const batchMatches = batch.filter(article => 
                    (article.title && article.title.toLowerCase().includes(searchLower)) ||
                    (article.author && article.author.toLowerCase().includes(searchLower)) ||
                    (article.excerpt && article.excerpt.toLowerCase().includes(searchLower)) ||
                    (article.content && article.content.toLowerCase().includes(searchLower))
                );
                
                searchResults.push(...batchMatches);
                offset += BATCH_SIZE;

                // Safety break to prevent extremely long-running searches on huge datasets
                if (offset > 5000) {
                    hasMore = false;
                }
            }
        }

        return new Response(JSON.stringify(searchResults), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch(e) {
        console.error('Error in searchArticles function:', e);
        return new Response(JSON.stringify({ error: `Function error: ${e.message}` }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});