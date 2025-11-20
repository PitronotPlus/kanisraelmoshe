import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Helper function to count words in HTML content
const countWords = (htmlString) => {
  if (!htmlString) return 0;
  const text = htmlString.replace(/<[^>]*>/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized - Admin only' }), { 
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { threshold = 20 } = await req.json();

        console.log(`Starting thin content scan with threshold: ${threshold} words`);

        const BATCH_SIZE = 200;
        let offset = 0;
        let hasMore = true;
        let totalScanned = 0;
        const thinArticles = [];

        while (hasMore) {
            console.log(`Scanning batch: ${offset} to ${offset + BATCH_SIZE}`);
            
            const batch = await base44.asServiceRole.entities.Article.list('-created_date', BATCH_SIZE, offset);

            if (batch.length === 0) {
                hasMore = false;
                break;
            }

            totalScanned += batch.length;

            // Process batch and find thin content
            for (const article of batch) {
                const wordCount = countWords(article.content);
                if (wordCount < threshold) {
                    thinArticles.push({
                        id: article.id,
                        title: article.title,
                        content: article.content,
                        created_date: article.created_date,
                        wordCount
                    });
                }
            }

            offset += BATCH_SIZE;

            // Small delay to prevent overload
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        console.log(`Scan complete. Total scanned: ${totalScanned}, Thin content found: ${thinArticles.length}`);

        return new Response(JSON.stringify({
            success: true,
            data: {
                thinArticles,
                totalScanned,
                threshold
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error in scanThinContent:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});