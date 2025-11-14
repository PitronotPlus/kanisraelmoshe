import { createClient } from 'npm:@base44/sdk@0.1.0';
import { encode } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { 
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
        const token = authHeader.split(' ')[1];
        base44.auth.setToken(token);

        const { imageUrl } = await req.json();
        if (!imageUrl) {
            return new Response(JSON.stringify({ success: false, error: 'imageUrl is required' }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        console.log('Downloading image from:', imageUrl);

        const response = await fetch(imageUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (compatible; Base44Bot/1.0; +https://base44.com)',
                'Accept': 'image/*',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(30000)
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        
        let originalFilename = 'image.jpg';
        try {
            const urlPath = new URL(imageUrl).pathname;
            const pathSegments = urlPath.split('/');
            const lastSegment = pathSegments[pathSegments.length - 1];
            if (lastSegment && lastSegment.includes('.')) {
                originalFilename = decodeURIComponent(lastSegment.split('?')[0]);
            }
        } catch (e) {
            // Keep default filename if URL parsing fails
        }

        // Convert to base64 using the efficient Deno standard library
        const base64 = encode(arrayBuffer);

        return new Response(JSON.stringify({
            success: true,
            base64: base64,
            contentType: contentType,
            filename: originalFilename,
            size: arrayBuffer.byteLength
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('[ERROR] in downloadImageFromUrl:', error.message);
        return new Response(JSON.stringify({ 
            success: false,
            error: error.message 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});