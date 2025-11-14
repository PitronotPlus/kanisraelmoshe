import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { InvokeLLM } from "@/integrations/Core";

// Helper function to style article content using AI
async function styleArticleContent(content) {
    try {
        const prompt = `אתה עורך מקצועי של אתר חדשות בעברית. 
המשימה שלך היא לקחת את התוכן הבא ולעצב אותו בצורה מקצועית ונעימה לקריאה.

הוסף:
1. הפרדה ברורה בין פסקאות (רווח כפול)
2. כותרות משנה רלוונטיות במקומות המתאימים
3. שיפור קל של הניסוח אם נדרש (אבל שמור על התוכן המקורי)
4. רווחים נוספים לפני נקודות חשובות

חשוב: שמור על כל התוכן המקורי, רק שפר את המבנה והעיצוב.

התוכן המקורי:
${content}

החזר את התוכן המעוצב בפורמט HTML נקי:`;

        const response = await InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false
        });

        if (typeof response === 'string' && response.trim().length > 0) {
            return response.trim();
        }
        
        return null;
        
    } catch (error) {
        console.error('Error styling content with AI:', error);
        throw error;
    }
}

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    
    if (!(await base44.auth.isAuthenticated())) {
        return new Response(JSON.stringify({ success: false, message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { articleIds } = await req.json();
        
        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            return new Response(JSON.stringify({ 
                success: false, 
                message: 'מזהי מאמרים לא תקינים' 
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const results = {
            success: true,
            successfulArticles: [],
            failedArticles: [],
            message: `עיבוד ${articleIds.length} מאמרים הושלם`
        };

        // Process articles one by one with proper delays
        for (let i = 0; i < articleIds.length; i++) {
            const articleId = articleIds[i];
            
            try {
                // Get article data
                const articles = await base44.entities.Article.filter({ id: articleId });
                
                if (articles.length === 0) {
                    results.failedArticles.push({ id: articleId, error: 'מאמר לא נמצא' });
                    continue;
                }
                
                const article = articles[0];
                
                // Check if article has sufficient content
                if (!article.content || article.content.trim().length < 50) {
                    results.failedArticles.push({ id: articleId, error: 'תוכן מאמר חסר או קצר מדי' });
                    continue;
                }

                // Check if already styled this year
                const currentYear = new Date().getFullYear();
                if (article.styled_date) {
                    const styledYear = new Date(article.styled_date).getFullYear();
                    if (styledYear >= currentYear) {
                        results.failedArticles.push({ id: articleId, error: 'מאמר כבר עוצב השנה' });
                        continue;
                    }
                }

                // Style the article content
                const styledContent = await styleArticleContent(article.content);
                
                if (!styledContent) {
                    results.failedArticles.push({ id: articleId, error: 'נכשל בעיצוב התוכן' });
                    continue;
                }

                // Update article with styled content and mark as styled
                await base44.entities.Article.update(articleId, {
                    content: styledContent,
                    is_styled: true,
                    styled_date: new Date().toISOString()
                });

                results.successfulArticles.push(articleId);
                
                // Add delays between articles to avoid rate limiting
                if ((i + 1) % 3 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 8000)); // 8 seconds every 3 articles
                } else {
                    await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds between articles
                }
                
            } catch (error) {
                console.error(`Error styling article ${articleId}:`, error);
                let errorMessage = 'שגיאה לא ידועה';
                
                const errorStr = error.message || '';
                if (errorStr.includes('rate limit') || errorStr.includes('Rate limit')) {
                    errorMessage = 'Rate limit exceeded';
                    // Extra long delay on rate limit
                    await new Promise(resolve => setTimeout(resolve, 15000));
                } else if (errorStr.includes('timeout') || errorStr.includes('TIMEOUT')) {
                    errorMessage = 'Timeout error';
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else if (errorStr.includes('Network')) {
                    errorMessage = 'Network Error';
                    await new Promise(resolve => setTimeout(resolve, 5000));
                } else {
                    errorMessage = errorStr || 'שגיאה בעיצוב המאמר';
                }
                
                results.failedArticles.push({ id: articleId, error: errorMessage });
            }
        }

        return new Response(JSON.stringify(results), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in styleArticle function:', error);
        return new Response(JSON.stringify({ 
            success: false, 
            message: `שגיאה כללית: ${error.message}` 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
});