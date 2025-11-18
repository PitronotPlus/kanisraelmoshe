import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);

    try {
        // Check authentication
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ 
                success: false, 
                error: 'Unauthorized - Admin access required' 
            }), { 
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log('Starting comprehensive scan for articles with external images...');

        const BATCH_SIZE = 50; // Reduced batch size
        const MAX_ARTICLES_TO_SCAN = 500; // Limit total scan to prevent timeout
        let offset = 0;
        let hasMore = true;
        const repairableArticles = [];
        let totalScanned = 0;

        // Enhanced function to check if URL is external and needs repair
        const isExternalUrl = (url) => {
            if (!url) return false;
            // Also check for truncated WordPress URLs
            if (url.startsWith('/wp-content/uploads/')) return true;
            if (!url.startsWith('http')) return false;
            
            // List of internal/trusted domains
            const internalHosts = [
                'supabase.co', 
                'base44.app', 
                'qtrypzzcjebvfcihiynt.supabase.co',
                'localhost',
                '127.0.0.1'
            ];
            
            try {
                const hostname = new URL(url).hostname.toLowerCase();
                const isInternal = internalHosts.some(host => 
                    hostname === host || hostname.endsWith('.' + host)
                );
                
                // Additional checks for commonly problematic external sources
                const isProblematicSource = hostname.includes('oaidalleapiprodscus') || 
                                          hostname.includes('picsum.photos') ||
                                          hostname.includes('unsplash.com') ||
                                          hostname.includes('images.google.com') ||
                                          hostname.includes('drive.google.com');
                
                return !isInternal || isProblematicSource;
            } catch (e) {
                console.warn(`Invalid URL encountered: ${url}`);
                return false;
            }
        };

        // Enhanced function to extract all image URLs from HTML content
        const extractImagesFromContent = (htmlContent) => {
            if (!htmlContent) return [];
            
            const images = [];
            
            // Multiple regex patterns to catch different image formats
            const patterns = [
                /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
                /<img[^>]+src=([^\s>]+)[^>]*>/gi,
                /background-image:\s*url\(["']?([^"')]+)["']?\)/gi,
                /<figure[^>]*>.*?<img[^>]+src=["']([^"']+)["'][^>]*>.*?<\/figure>/gi
            ];
            
            patterns.forEach(pattern => {
                let match;
                while ((match = pattern.exec(htmlContent)) !== null) {
                    const url = match[1];
                    if (url && !images.includes(url)) {
                        images.push(url);
                    }
                }
            });
            
            return images;
        };

        while (hasMore && totalScanned < MAX_ARTICLES_TO_SCAN) {
            console.log(`Scanning batch: ${offset + 1} to ${offset + BATCH_SIZE}`);
            
            try {
                // Get articles with both published and unpublished content
                const batch = await base44.asServiceRole.entities.Article.list('-created_date', BATCH_SIZE, offset);

                if (batch.length === 0) {
                    hasMore = false;
                    console.log('No more articles to scan');
                    break;
                }

                totalScanned += batch.length;
                
                // Stop if we've reached the max articles limit
                if (totalScanned >= MAX_ARTICLES_TO_SCAN) {
                    console.log(`Reached max scan limit of ${MAX_ARTICLES_TO_SCAN} articles`);
                    hasMore = false;
                }

                for (const article of batch) {
                    let hasExternalImages = false;
                    const externalImages = [];
                    
                    // Check featured image
                    if (article.featured_image) {
                        if (isExternalUrl(article.featured_image)) {
                            hasExternalImages = true;
                            externalImages.push({
                                type: 'featured_image',
                                url: article.featured_image
                            });
                        }
                    }
                    
                    // Check content images
                    if (article.content) {
                        const contentImages = extractImagesFromContent(article.content);
                        for (const imageUrl of contentImages) {
                            if (isExternalUrl(imageUrl)) {
                                hasExternalImages = true;
                                externalImages.push({
                                    type: 'content',
                                    url: imageUrl
                                });
                            }
                        }
                    }
                    
                    // If article has external images, add it to repair list
                    if (hasExternalImages) {
                        repairableArticles.push({
                            id: article.id,
                            title: article.title,
                            created_date: article.created_date,
                            featured_image: article.featured_image,
                            external_images: externalImages,
                            external_image_count: externalImages.length
                        });
                        
                        console.log(`Found article with external images: "${article.title}" (${externalImages.length} images)`);
                    }
                }

                offset += BATCH_SIZE;
                
                // Reduce delay to speed up processing
                if (hasMore && totalScanned < MAX_ARTICLES_TO_SCAN) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
                
            } catch (batchError) {
                console.error(`Error processing batch at offset ${offset}:`, batchError);
                // Continue with next batch instead of failing completely
                offset += BATCH_SIZE;
                continue;
            }
        }

        console.log(`Scan complete. Scanned ${totalScanned} articles, found ${repairableArticles.length} articles needing repair`);

        // Sort by creation date (newest first) for better UX
        repairableArticles.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

        return new Response(JSON.stringify({
            success: true,
            data: repairableArticles,
            stats: {
                total_scanned: totalScanned,
                repairable_found: repairableArticles.length,
                scan_completed_at: new Date().toISOString()
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Critical error in getRepairableArticles:', error);
        return new Response(JSON.stringify({
            success: false,
            error: `Function failed: ${error.message}`,
            details: error.stack
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});