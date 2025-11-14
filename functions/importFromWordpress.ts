
import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import * as cheerio from 'npm:cheerio';
import { slugify } from 'https://deno.land/x/slugify/mod.ts';

const isExternalUrl = (url) => {
  if (!url || !url.startsWith('http')) return false;
  const internalHosts = ['supabase.co', 'base44.app', 'qtrypzzcjebvfcihiynt.supabase.co'];
  try {
    const hostname = new URL(url).hostname;
    return !internalHosts.some(host => hostname.endsWith(host) || hostname.includes(host));
  } catch (e) {
    return false;
  }
};

const generateSlug = (text) => {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9\u0590-\u05FF\-_]/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

// Function to clean the HTML content
const cleanHtmlContent = (html) => {
    if (!html) return '';

    const $ = cheerio.load(html);

    // Remove specific unwanted elements by selector
    const selectorsToRemove = [
        '.vortex-container-vote',
        '.wprc-container',
        '.meta-tags',
        '#wpdevar_comment_1',
        'script',
        'style', // Remove internal style blocks, we rely on inline styles
        '.entry-headline h5', // Remove the headline if it's consistently the same
        '.fluid-width-video-wrapper iframe[src*="youtube.com/embed/sd-eb-hTWqU"]' // Remove specific iframe if needed
    ];

    selectorsToRemove.forEach(selector => $(selector).remove());

    // Remove empty paragraphs that might be left after cleaning
    $('p').each(function() {
        if ($(this).html().trim() === '' && $(this).children().length === 0) {
            $(this).remove();
        }
    });

    // Extract the main content if it's wrapped in a specific div
    let contentHtml = html;
    if ($('.entry-content').length > 0) {
        contentHtml = $('.entry-content').html();
    } else {
        // Fallback if the main container is not present, just use the body
        contentHtml = $('body').html();
    }
    
    // Return the cleaned HTML
    return contentHtml;
};

// Helper function to count words (handles both plain text and HTML strings)
const countWords = (htmlString) => {
    if (!htmlString || typeof htmlString !== 'string') return 0;
    const text = htmlString.replace(/<[^>]*>/g, ' ').trim();
    return text.split(/\s+/).filter(word => word.length > 0).length;
};

// Helper function to add logs to an array
const addLog = (logsArray, message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('he-IL');
    logsArray.push(`${timestamp} - ${message}`);
};


Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Auth check - token is handled by createClientFromRequest
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) return new Response('Unauthorized', { status: 401 });
        // Token is implicitly used by base44 client from request

        const {
            batchData,
            fieldMappings,
            createNewCategories,
            fallbackCategory,
            importPublishState,
            skipThinContent // Flag from the frontend
        } = await req.json();

        const logs = [];
        addLog(logs, `🚀 מתחיל עיבוד מנה של ${batchData.length} מאמרים`);

        const allCategories = await base44.entities.Category.list();

        const getOrCreateCategory = async (name, parentId = null) => {
            if (!name) return null;
            let category = allCategories.find(c => c.name === name && c.parent_id === parentId);
            if (category) {
                addLog(logs, `🔍 נמצאה קטגוריה: ${name}`);
                return category;
            }
            if (createNewCategories) {
                addLog(logs, `➕ יוצר קטגוריה חדשה: ${name}`);
                const newCategoryData = {
                    name,
                    slug: generateSlug(name),
                    parent_id: parentId,
                    color_class: 'blue'
                };
                category = await base44.entities.Category.create(newCategoryData);
                allCategories.push(category); // Add to the local list for subsequent checks
                return category;
            }
            return null;
        };
        
        let successfulInBatch = 0;
        let failedInBatch = 0;
        let categoriesCreatedInBatch = 0;
        let errorsInBatch = [];

        for (const row of batchData) {
            const articleTitle = row[fieldMappings.title];
            
            try {
                if (!articleTitle) {
                    addLog(logs, "שגיאה: שדה הכותרת ריק או לא ממופה כראוי. דילוג על שורה זו.", 'error');
                    errorsInBatch.push("שדה הכותרת ריק או לא ממופה כראוי.");
                    failedInBatch++;
                    continue;
                }

                addLog(logs, `🔄 מעבד: "${articleTitle}"`);

                const existingArticles = await base44.entities.Article.filter({ title: articleTitle });
                if (existingArticles.length > 0) {
                    addLog(logs, `⚠️ המאמר "${articleTitle}" כבר קיים, מדלג.`);
                    failedInBatch++;
                    continue;
                }

                // Get raw content for word count and then clean it
                const rawContent = row[fieldMappings.content];
                
                // Skip thin content - check word count if the flag is enabled
                const wordCount = countWords(rawContent); 
                if (skipThinContent && wordCount < 100) { 
                    addLog(logs, `⏭️ דולג על מאמר "${articleTitle}" - תוכן דל (${wordCount} מילים בלבד)`);
                    failedInBatch++; 
                    continue; 
                }

                addLog(logs, `📝 מעבד מאמר "${articleTitle}" (${wordCount} מילים)`);

                const cleanedContent = cleanHtmlContent(rawContent);

                // Determine category, including new length check
                let currentCategoryName = fieldMappings.category && row[fieldMappings.category] ? String(row[fieldMappings.category]).trim() : null;

                // NEW: Word count check for category name
                if (currentCategoryName && countWords(currentCategoryName) > 20) {
                    addLog(logs, `⚠️ דילוג על יצירת קטגוריה "${currentCategoryName.substring(0, 50)}..." - שם ארוך מדי. המאמר ישויך לקטגוריית ברירת המחדל.`);
                    currentCategoryName = null; // Set to null to trigger fallback logic
                }
                
                let categoryId; // Declared as per outline, currently unused
                let categorySlug; // Declared as per outline, currently unused

                let finalCategoryName = fallbackCategory;
                if (currentCategoryName) { // Use the processed category name
                    const category = await getOrCreateCategory(currentCategoryName, null);
                    if (category) {
                        finalCategoryName = category.name;
                        // Only increment if the category was newly created in this batch
                        // This check verifies if the category was *not* already in the list retrieved at the start
                        if (!allCategories.some(c => c.id === category.id)) {
                           categoriesCreatedInBatch++;
                        }
                    }
                }

                // Determine article status
                let articleStatus = 'published'; 
                if (importPublishState === 'draft_all') {
                    articleStatus = 'draft';
                } else if (importPublishState === 'from_file' && fieldMappings.status && row[fieldMappings.status]) {
                    const fileStatus = String(row[fieldMappings.status]).toLowerCase();
                    if (['published', 'publish', 'פורסם'].includes(fileStatus)) {
                        articleStatus = 'published';
                    } else if (['draft', 'טיוטה'].includes(fileStatus)) {
                        articleStatus = 'draft';
                    } else if (['pending', 'pending_approval', 'ממתין לאישור'].includes(fileStatus)) {
                        articleStatus = 'pending_approval';
                    }
                }

                const originalPublicationDate = fieldMappings.original_publication_date && row[fieldMappings.original_publication_date]
                    ? new Date(row[fieldMappings.original_publication_date]).toISOString()
                    : new Date().toISOString(); 

                const excerpt = row[fieldMappings.excerpt] || '';
                const featuredImage = row[fieldMappings.featured_image] || ''; 
                const author = row[fieldMappings.author] || 'מערכת'; 
                const tags = fieldMappings.tags && row[fieldMappings.tags] ? String(row[fieldMappings.tags]).split(',').map(tag => tag.trim()).filter(Boolean) : [];
                const articleSlug = generateSlug(articleTitle);

                const articleData = {
                    title: articleTitle,
                    content: cleanedContent,
                    excerpt: excerpt,
                    category: finalCategoryName,
                    subcategory: '', 
                    status: articleStatus, 
                    published: articleStatus === 'published', 
                    featured_image: featuredImage,
                    author: author,
                    tags: tags,
                    original_publication_date: originalPublicationDate,
                    original_source_url: '', 
                    slug: articleSlug
                };

                const createdArticle = await base44.entities.Article.create(articleData);
                successfulInBatch++;
                addLog(logs, `✅ מאמר "${articleTitle}" נוצר בהצלחה`);
                
            } catch (error) {
                if (error.message && error.message.toLowerCase().includes('rate limit')) {
                    addLog(logs, `🛑 הגעת למגבלת בקשות במהלך עיבוד "${articleTitle}"`);
                    throw new Error('Rate limit exceeded'); 
                }
                
                const errorMessage = `שגיאה בעיבוד המאמר "${articleTitle || 'לא ידוע'}": ${error.message}`;
                addLog(logs, `❌ ${errorMessage}`);
                errorsInBatch.push(errorMessage);
                failedInBatch++;
            }
        }
        
        return new Response(JSON.stringify({
            success: true, 
            details: {
                successfulInBatch,
                failedInBatch,
                categoriesCreatedInBatch,
                errorsInBatch,
                logs 
            }
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch(e) {
        let errorMessage = e.message || 'שגיאה לא ידועה';
        
        if (errorMessage.toLowerCase().includes('rate limit')) {
            errorMessage = 'Rate limit exceeded';
        }
        
        return new Response(JSON.stringify({ 
            success: false, 
            message: `שגיאה קריטית בפונקציה: ${errorMessage}` 
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
