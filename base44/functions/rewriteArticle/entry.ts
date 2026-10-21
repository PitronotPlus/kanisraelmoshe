import { createClient } from 'npm:@base44/sdk@0.1.0';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
    apiKey: Deno.env.get("OpenAi_API_KEY"),
});

const base44 = createClient({
    appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
    try {
        // Authenticate user
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        base44.auth.setToken(authHeader.split(' ')[1]);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
        }

        const { articleId } = await req.json();
        if (!articleId) {
            throw new Error("Article ID is required.");
        }

        // Fetch the article
        const article = await base44.entities.Article.get(articleId);
        if (!article || !article.content) {
            throw new Error(`Article with ID ${articleId} not found or has no content.`);
        }

        // Construct the prompt for rewriting
        const prompt = `
            Please rewrite the following news article for an Israeli audience. 
            The tone should be engaging, clear, and objective, suitable for a general news website.
            Maintain all the key facts and information from the original text.
            The article must be in Hebrew.

            Original Title: "${article.title}"
            Original Content:
            ---
            ${article.content.replace(/<[^>]*>/g, '')}
            ---
            
            Return ONLY the rewritten Hebrew content. Do not add any introductory phrases like "Here is the rewritten article:".
        `;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a professional news editor for an Israeli online publication." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const newContent = response.choices[0].message.content;
        
        if (!newContent) {
            throw new Error("AI failed to generate new content.");
        }

        // Update the article with the new content
        await base44.entities.Article.update(articleId, { content: `<p>${newContent.replace(/\n/g, '</p><p>')}</p>` });

        return new Response(JSON.stringify({ success: true, message: `Article ${articleId} rewritten.` }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in rewriteArticle function:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});