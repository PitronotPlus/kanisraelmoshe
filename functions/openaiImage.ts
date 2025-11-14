import OpenAI from 'npm:openai@4.28.0';

const openai = new OpenAI({
  apiKey: Deno.env.get("OpenAi_API_KEY"),
});

// Function to sanitize titles for OpenAI safety system
const sanitizeTitle = (title) => {
  // Replace problematic words that might trigger OpenAI safety system
  let sanitized = title
    .replace(/מירי/g, 'פגיעה')
    .replace(/ירי/g, 'פגיעה')
    .replace(/נורה/g, 'נפגע')
    .replace(/יריות/g, 'פגיעות')
    .replace(/רצח/g, 'אירוע')
    .replace(/הרג/g, 'אירוע')
    .replace(/מות/g, 'אירוע')
    .replace(/דם/g, 'פציעה')
    .replace(/פצוע/g, 'נפגע')
    .replace(/נפצע/g, 'נפגע')
    .replace(/נהרג/g, 'נפגע')
    .replace(/מת/g, 'נפגע')
    .replace(/התנקשות/g, 'אירוע')
    .replace(/פיגוע/g, 'אירוע')
    .replace(/טרור/g, 'אירוע')
    .replace(/חבלה/g, 'נזק')
    .replace(/פגז/g, 'פגיעה')
    .replace(/רקטה/g, 'קליע')
    .replace(/נפץ/g, 'פגיעה')
    .replace(/מלחמה/g, 'סכסוך')
    .replace(/קרב/g, 'עימות')
    .replace(/לחימה/g, 'פעילות')
    .replace(/תקיפה/g, 'פעולה')
    .replace(/הפצצה/g, 'פגיעה');

  return sanitized;
};

Deno.serve(async (req) => {
  try {
    const { title } = await req.json();

    if (!title) {
      return new Response(JSON.stringify({
        success: false,
        message: "Title is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if OpenAI API key is available
    if (!Deno.env.get("OpenAi_API_KEY")) {
      return new Response(JSON.stringify({
        success: false,
        message: "מפתח OpenAI API לא מוגדר בהגדרות המערכת"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize the title to avoid safety system issues
    const sanitizedTitle = sanitizeTitle(title);

    // Create a more detailed, professional prompt
    const prompt = `Create a high-quality, photorealistic image related to the news headline: "${sanitizedTitle}". 
    The image should be professional, suitable for news media, and visually appealing. 
    Style: photojournalism, clean composition, good lighting, suitable for Hebrew news website.
    Avoid any violent, graphic, or sensitive content. Focus on neutral, informative visual representation.`;

    console.log(`Generating image for title: "${title}" (sanitized: "${sanitizedTitle}")`);

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    if (!response.data || !response.data[0] || !response.data[0].url) {
      throw new Error("לא התקבלה תמונה מ-OpenAI");
    }

    const imageUrl = response.data[0].url;

    return new Response(JSON.stringify({
      success: true,
      imageUrl: imageUrl,
      message: "תמונה נוצרה בהצלחה"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Error in openaiImage function:', error);
    
    let errorMessage = "שגיאה לא צפויה ביצירת התמונה";
    let statusCode = 500;

    // Handle specific OpenAI errors
    if (error.message && error.message.includes('safety system')) {
      errorMessage = "הכותרת מכילה תוכן שלא מותר על-ידי מערכת הבטיחות של OpenAI. נסה כותרת אחרת.";
      statusCode = 400;
    } else if (error.message && error.message.includes('billing')) {
      errorMessage = "בעיה בחיוב OpenAI - אנא בדוק את חשבון ה-API";
      statusCode = 402;
    } else if (error.message && error.message.includes('rate limit')) {
      errorMessage = "הגעת למגבלת הקצב של OpenAI - נסה שוב מאוחר יותר";
      statusCode = 429;
    } else if (error.message && error.message.includes('API key')) {
      errorMessage = "מפתח OpenAI API לא תקין";
      statusCode = 401;
    }

    return new Response(JSON.stringify({
      success: false,
      message: errorMessage,
      error: error.message
    }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
});