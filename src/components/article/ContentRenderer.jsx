
import { useCallback } from 'react';

export default function ContentRenderer({ content, articleId, siteConfig }) {
  if (!content) return null;

  const processContent = useCallback((rawContent) => {
    if (!rawContent) return '';

    try {
      // Remove potentially dangerous script tags
      let processedContent = rawContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

      // Replace iframe with safer embedded content when possible, specifically for YouTube
      processedContent = processedContent.replace(
        /<iframe[^>]+src=['"](https:\/\/www\.youtube\.com\/embed\/[^'"]+)['"][^>]*><\/iframe>/gi,
        (match, url) => {
          const videoId = url.split('/').pop()?.split('?')[0];
          if (videoId) {
            // Use the video-wrapper class for responsive embedding
            return `<div class="video-wrapper">
              <iframe src="${url}" frameborder="0" allowfullscreen></iframe>
            </div>`;
          }
          return match;
        }
      );

      // Process injected code snippets safely
      if (siteConfig?.article_injects && Array.isArray(siteConfig.article_injects)) {
        siteConfig.article_injects
          .filter(inject => inject.enabled && inject.type === 'html') // Only allow HTML type injections
          .sort((a, b) => (a.position || 0) - (b.position || 0)) // Sort by position
          .forEach(inject => {
            // Only inject HTML, strictly prevent script injection
            if (inject.code && !/<script/i.test(inject.code)) {
              const position = inject.position || 0;
              const paragraphs = processedContent.split('</p>');
              if (paragraphs.length > position) {
                paragraphs[position] += inject.code;
                processedContent = paragraphs.join('</p>');
              }
            }
          });
      }

      return processedContent;
    } catch (error) {
      console.error('Error processing content:', error);
      return rawContent; // Return original content in case of error
    }
  }, [siteConfig]); // Re-run useCallback if siteConfig changes

  return (
    <>
      <style>{`
        /* Scoping styles to the imported content */
        .imported-article-content {
          line-height: 1.6;
          color: inherit;
        }

        /* Reset some inherited styles */
        .imported-article-content * {
          max-width: 100%;
        }

        /* Table styles */
        .imported-article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
          font-size: inherit;
        }

        .imported-article-content th,
        .imported-article-content td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: right;
        }

        .imported-article-content th {
          background-color: #f2f2f2;
          font-weight: bold;
        }

        /* Image styles */
        .imported-article-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        /* Video and iframe styles */
        .imported-article-content iframe,
        .imported-article-content video {
          max-width: 100%;
          border-radius: 8px;
          margin: 1rem 0;
          /* Reset specific styles applied by video-wrapper */
          position: initial; 
          top: initial;
          left: initial;
          height: initial;
          width: initial;
        }

        /* Responsive video wrapper for iframes (e.g., YouTube) */
        .video-wrapper {
          position: relative;
          padding-bottom: 56.25%; /* 16:9 aspect ratio (height / width * 100%) */
          height: 0;
          overflow: hidden;
          margin: 1rem 0; /* Consistent margin with images/videos */
          border-radius: 8px; /* Consistent border-radius */
        }

        .video-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: inherit; /* Inherit border-radius from wrapper */
        }

        /* Paragraph spacing */
        .imported-article-content p {
          margin: 1em 0;
          line-height: 1.7;
        }

        /* Heading styles */
        .imported-article-content h1,
        .imported-article-content h2,
        .imported-article-content h3,
        .imported-article-content h4,
        .imported-article-content h5,
        .imported-article-content h6 {
          margin: 1.5em 0 0.8em 0;
          line-height: 1.3;
        }

        /* List styles */
        .imported-article-content ul,
        .imported-article-content ol {
          margin: 1em 0;
          padding-right: 2em;
        }

        .imported-article-content li {
          margin: 0.5em 0;
        }

        /* Blockquote styles */
        .imported-article-content blockquote {
          border-right: 4px solid #ddd;
          padding-right: 1em;
          margin: 1.5em 0;
          color: #666;
          font-style: italic;
        }

        /* Link styles */
        .imported-article-content a {
          color: #2563eb;
          text-decoration: underline;
        }

        .imported-article-content a:hover {
          color: #1d4ed8;
        }

        /* Code styles */
        .imported-article-content code {
          background-color: #f1f5f9;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }

        .imported-article-content pre {
          background-color: #f1f5f9;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
        }

        .imported-article-content pre code {
          background: none;
          padding: 0;
        }

        /* Preserve inline styles from original content */
        .imported-article-content [style] {
          /* Allow inline styles to take precedence */
        }
      `}</style>
      <div
        className="article-content imported-article-content prose max-w-none"
        dangerouslySetInnerHTML={{ __html: processContent(content) }}
      />
    </>
  );
}
