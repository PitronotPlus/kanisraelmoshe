import { useState, useEffect } from 'react';

const OptimizedImage = ({ 
    src, 
    alt, 
    className = '', 
    width, 
    height,
    loading = 'lazy',
    sizes = '(max-width: 400px) 200px, (max-width: 800px) 400px, 800px',
    quality = 80,
    fetchPriority = 'auto',
    ...props 
}) => {
    // For now, just use regular img tag with optimizations
    // When the backend function is ready, we can enable auto-optimization
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    // Simple WebP detection and fallback
    const supportsWebP = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    useEffect(() => {
        // For external images, try to use WebP if supported
        if (src && src.includes('picsum.photos') && supportsWebP()) {
            setImgSrc(src.replace('picsum.photos', 'picsum.photos') + '?format=webp');
        } else {
            setImgSrc(src);
        }
    }, [src]);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(src); // Fallback to original
        }
    };

    return (
        <img 
            src={imgSrc}
            alt={alt}
            className={className}
            width={width}
            height={height}
            loading={loading}
            onError={handleError}
            {...(fetchPriority === 'high' && { fetchPriority: 'high' })}
            {...props}
        />
    );
};

export default OptimizedImage;