import { createClient } from 'npm:@base44/sdk@0.1.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClient({
          appId: Deno.env.get('BASE44_APP_ID'),
        });
        
        const { authorId } = await req.json();

        if (!authorId) {
            return new Response(JSON.stringify({ error: 'Author ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Backend functions can query entities without client-side RLS policies.
        const authorData = await base44.entities.User.filter({ id: authorId });

        if (!authorData || authorData.length === 0) {
            return new Response(JSON.stringify(null), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const author = authorData[0];

        // Return only the public-safe fields
        const publicProfile = {
            id: author.id,
            display_name: author.display_name || author.full_name,
            bio: author.bio,
            profile_image_url: author.profile_image_url,
            social_links: author.social_links
        };

        return new Response(JSON.stringify(publicProfile), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in getAuthorPublicProfile:', error.message);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});