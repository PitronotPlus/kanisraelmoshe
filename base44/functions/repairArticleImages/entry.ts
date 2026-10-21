import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const user = await base44.auth.me();
        if (!user) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        const { articleId } = await req.json();
        if (!articleId) {
            return new Response(JSON.stringify({ success: false, error: 'Article ID is required' }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Get the article
        const articles = await base44.entities.Article.filter({ id: articleId });
        if (articles.length === 0) {
            return new Response(JSON.stringify({ success: false, error: 'Article not found' }), { 
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }
        const article = articles[0];

        console.log('Processing article:', article.title);

        const isExternalUrl = (url) => {
            if (!url || !url.startsWith('http')) return false;
            const internalHosts = [
                'supabase.co', 
                'base44.app', 
                'qtrypzzcjebvfcihiynt.supabase.co'
            ];
            try {
                const hostname = new URL(url).hostname;
                return !internalHosts.some(host => hostname.endsWith(host) || hostname.includes(host));
            } catch (e) {
                return false;
            }
        };

        const fixTruncatedUrl = (url) => {
            // Fix truncated WordPress URLs from kanisrael.co.il
            if (url.startsWith('/wp-content/uploads/')) {
                return `https://kanisrael.co.il${url}`;
            }
            if (url.startsWith('src="/wp-content/uploads/')) {
                return `https://kanisrael.co.il${url.substring(5)}`;
            }
            return url;
        };

        const tryDownloadImage = async (url) => {
            try {
                // Fix truncated URLs before attempting download
                const fixedUrl = fixTruncatedUrl(url);
                console.log(`Attempting to download image: ${fixedUrl}`);
                if (fixedUrl !== url) {
                    console.log(`Fixed truncated URL from: ${url}`);
                }
                
                // Check if it's an expired OpenAI URL
                if (fixedUrl.includes('oaidalleapiprodscus.blob.core.windows.net')) {
                    console.log('Detected OpenAI image URL - checking if expired...');
                }

                const response = await fetch(fixedUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; Base44Bot/1.0)',
                        'Accept': 'image/*'
                    },
                    signal: AbortSignal.timeout(15000) // 15 second timeout
                });

                if (!response.ok) {
                    console.log(`Failed to download image: ${response.status} ${response.statusText}`);
                    return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
                }

                const arrayBuffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                
                // Create filename
                let filename = 'image.jpg';
                try {
                    const urlPath = new URL(url).pathname;
                    const pathSegments = urlPath.split('/');
                    const lastSegment = pathSegments[pathSegments.length - 1];
                    if (lastSegment && lastSegment.includes('.')) {
                        filename = decodeURIComponent(lastSegment.split('?')[0]);
                    }
                } catch (e) {
                    // Keep default filename
                }

                // Convert to base64 using Deno's built-in encoder
                const uint8Array = new Uint8Array(arrayBuffer);
                let base64 = '';
                const chunk = 1024;
                for (let i = 0; i < uint8Array.length; i += chunk) {
                    base64 += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunk));
                }
                base64 = btoa(base64);

                console.log(`Successfully downloaded image: ${arrayBuffer.byteLength} bytes`);
                return {
                    success: true,
                    base64,
                    contentType,
                    filename,
                    size: arrayBuffer.byteLength
                };

            } catch (error) {
                console.log(`Error downloading image: ${error.message}`);
                return { success: false, error: error.message };
            }
        };

        // Try to repair featured image first
        if (article.featured_image && isExternalUrl(article.featured_image)) {
            console.log('Attempting to repair featured image...');
            const downloadResult = await tryDownloadImage(article.featured_image);
            
            if (downloadResult.success) {
                return new Response(JSON.stringify({
                    success: true,
                    base64: downloadResult.base64,
                    contentType: downloadResult.contentType,
                    filename: downloadResult.filename,
                    originalUrl: article.featured_image,
                    imageType: 'featured_image',
                    totalExternalImages: 1
                }), {
                    status: 200,
                    headers: { "Content-Type": "application/json" }
                });
            } else {
                console.log(`Featured image failed: ${downloadResult.error}`);
            }
        }

        // Try to repair content images
        if (article.content) {
            const imgRegex = /<img[^>]+src="([^"]+)"/gi;
            const contentImages = [...article.content.matchAll(imgRegex)].map(match => match[1]);
            
            // Also detect truncated URLs in content
            const truncatedRegex = /src="(\/wp-content\/uploads\/[^"]+)"/gi;
            const truncatedImages = [...article.content.matchAll(truncatedRegex)].map(match => match[1]);
            
            // Combine and deduplicate
            const allContentImages = [...new Set([...contentImages, ...truncatedImages])];
            const externalContentImages = allContentImages.filter(url => isExternalUrl(url) || url.startsWith('/wp-content/uploads/'));
            
            console.log(`Found ${externalContentImages.length} external content images`);
            
            for (const imageUrl of externalContentImages) {
                console.log('Attempting to repair content image...');
                const downloadResult = await tryDownloadImage(imageUrl);
                
                if (downloadResult.success) {
                    return new Response(JSON.stringify({
                        success: true,
                        base64: downloadResult.base64,
                        contentType: downloadResult.contentType,
                        filename: downloadResult.filename,
                        originalUrl: imageUrl,
                        imageType: 'content',
                        totalExternalImages: externalContentImages.length
                    }), {
                        status: 200,
                        headers: { "Content-Type": "application/json" }
                    });
                } else {
                    console.log(`Content image failed: ${downloadResult.error}, trying next image...`);
                    // Continue to next image instead of failing completely
                }
            }
        }

        // If we get here, no images could be repaired
        console.log('No external images could be successfully downloaded');
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'No working external images found for repair. All external images in this article appear to be broken or inaccessible.' 
        }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Unexpected error in repairArticleImages:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            error: `Server error: ${error.message}` 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});