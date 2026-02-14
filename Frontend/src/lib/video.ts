
/**
 * Utility functions for handling video URLs and embedding logic.
 * Enforces the strict separation of User Input (Watch URL) and System Output (Embed URL).
 */

export const extractYouTubeId = (url: string): string | null => {
    if (!url || typeof url !== 'string') return null;

    const cleanUrl = url.trim();

    // If perfectly 11 chars and looks like an ID, return it
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
        return cleanUrl;
    }

    // Patterns to match various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match && match[1]) {
            const id = match[1].trim();
            // YouTube IDs are always 11 characters
            if (id.length >= 11) {
                const finalId = id.substring(0, 11);
                if (/^[a-zA-Z0-9_-]{11}$/.test(finalId)) {
                    return finalId;
                }
            }
        }
    }

    return null;
};

/**
 * Generates a high-quality YouTube thumbnail URL from a video ID or URL.
 * Uses hqdefault as it's more reliable than maxresdefault for all videos.
 */
export const getYouTubeThumbnail = (urlOrId: string): string => {
    const videoId = extractYouTubeId(urlOrId);
    if (!videoId) return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
    // hqdefault is more reliable than maxresdefault
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

export const getEmbedUrl = (urlOrId: string): string | null => {
    const id = extractYouTubeId(urlOrId);
    if (!id) return null;

    // Using the embed URL format which is often more reliable for iframe-based players
    return `https://www.youtube.com/embed/${id}`;
};

export const getVideoUnknownUrl = (urlOrId: string): string => {
    // Helper to return a playable URL for ReactPlayer even if we want to support other types later.
    // For now, strict adherence to YouTube Embed logic.
    const embed = getEmbedUrl(urlOrId);
    return embed || "";
};
