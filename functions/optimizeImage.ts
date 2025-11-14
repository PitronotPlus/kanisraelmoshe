import { createClient } from 'npm:@base44/sdk@0.1.0';
import Sharp from 'npm:sharp@0.33.0';

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        // Authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response('Unauthorized', { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);
        
        const { imageUrl, quality = 80, formats = ['webp', 'jpeg'], sizes = [800, 400, 200] } = await req.json();

        if (!imageUrl) {
            return new Response(JSON.stringify({ error: 'Image URL is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Download the original image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
        }

        const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
        const optimizedVersions = {};

        // Get image metadata
        const metadata = await Sharp(imageBuffer).metadata();
        const originalSize = imageBuffer.length;

        // Generate optimized versions
        for (const format of formats) {
            optimizedVersions[format] = {};
            
            for (const size of sizes) {
                // Skip if requested size is larger than original
                if (size > Math.max(metadata.width || 800, metadata.height || 600)) {
                    continue;
                }

                let sharpInstance = Sharp(imageBuffer);
                
                // Resize image
                sharpInstance = sharpInstance.resize(size, null, {
                    withoutEnlargement: true,
                    fit: 'inside'
                });

                // Apply format-specific optimizations
                if (format === 'webp') {
                    sharpInstance = sharpInstance.webp({ 
                        quality,
                        effort: 6,
                        smartSubsample: true
                    });
                } else if (format === 'jpeg') {
                    sharpInstance = sharpInstance.jpeg({ 
                        quality,
                        progressive: true
                    });
                }

                const optimizedBuffer = await sharpInstance.toBuffer();
                
                // Create a unique filename
                const filename = `optimized_${size}w_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${format}`;
                const file = new File([optimizedBuffer], filename, {
                    type: `image/${format}`
                });

                try {
                    // Upload optimized image using base44 storage
                    const uploadResult = await fetch('/api/storage/upload', {
                        method: 'POST',
                        headers: {
                            'Authorization': req.headers.get('Authorization')
                        },
                        body: (() => {
                            const formData = new FormData();
                            formData.append('file', file);
                            return formData;
                        })()
                    });

                    if (!uploadResult.ok) {
                        throw new Error(`Upload failed: ${uploadResult.status}`);
                    }

                    const uploadData = await uploadResult.json();
                    
                    optimizedVersions[format][size] = {
                        url: uploadData.file_url || uploadData.url,
                        size: optimizedBuffer.length,
                        width: size,
                        compression: Math.round(((originalSize - optimizedBuffer.length) / originalSize) * 100)
                    };
                } catch (uploadError) {
                    console.error(`Failed to upload ${format} ${size}px:`, uploadError);
                    // Continue with other sizes even if one fails
                }
            }
        }

        // Generate responsive image data
        const webpSizes = Object.keys(optimizedVersions.webp || {});
        const jpegSizes = Object.keys(optimizedVersions.jpeg || {});

        const webpSrcSet = webpSizes.length > 0 ? webpSizes
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map(size => `${optimizedVersions.webp[size].url} ${size}w`)
            .join(', ') : '';

        const jpegSrcSet = jpegSizes.length > 0 ? jpegSizes
            .sort((a, b) => parseInt(b) - parseInt(a))
            .map(size => `${optimizedVersions.jpeg[size].url} ${size}w`)
            .join(', ') : '';

        const result = {
            success: true,
            original: {
                url: imageUrl,
                size: originalSize,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format
            },
            optimized: optimizedVersions,
            totalSavings: Math.round(((originalSize - Object.values(optimizedVersions).reduce((acc, format) => 
                acc + Object.values(format).reduce((sum, variant) => sum + variant.size, 0), 0)) / originalSize) * 100),
            responsive: {
                webp: webpSrcSet,
                jpeg: jpegSrcSet
            }
        };

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Image optimization error:', error);
        return new Response(JSON.stringify({ 
            success: false,
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});