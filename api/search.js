import { storage } from "./_storage.js";

// Function to extract video ID from YouTube URLs
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

// Simple web scraping function for YouTube search
async function searchYouTubeByScraping(query, filter = 'relevant', page = 1) {
  try {
    const searchQuery = encodeURIComponent(query);
    const response = await fetch(`https://www.youtube.com/results?search_query=${searchQuery}`);
    const html = await response.text();
    
    // Extract video data from the HTML response
    const videoDataMatch = html.match(/var ytInitialData = ({.*?});/);
    if (!videoDataMatch) return [];
    
    const data = JSON.parse(videoDataMatch[1]);
    const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    
    if (!contents) return [];
    
    const videos = [];
    
    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents || [];
      
      for (const item of items) {
        if (item.videoRenderer) {
          const video = item.videoRenderer;
          videos.push({
            id: video.videoId,
            title: video.title?.runs?.[0]?.text || '',
            channelTitle: video.ownerText?.runs?.[0]?.text || '',
            channelId: video.ownerText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?.replace('/channel/', '') || '',
            thumbnailUrl: video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url || '',
            duration: video.lengthText?.simpleText || '',
            viewCount: video.viewCountText?.simpleText || '',
            publishedAt: video.publishedTimeText?.simpleText || ''
          });
        }
      }
    }
    
    return videos.slice(0, 20);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export default async function handler(req, res) {
  try {
    const { q: query, method = 'scraping', filter = 'relevant', page = '1' } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Query parameter is required" });
    }

    // Log search query
    await storage.createSearchQuery({
      query,
      timestamp: new Date().toISOString()
    });

    // Check if it's a YouTube URL
    const videoId = extractVideoId(query);
    if (videoId) {
      // For direct URLs, return basic video info
      const videoDetails = {
        id: videoId,
        title: `Video ${videoId}`,
        channelTitle: 'Unknown',
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '',
        viewCount: '',
        publishedAt: ''
      };
      
      await storage.createVideo(videoDetails);
      return res.json({ videos: [videoDetails], type: 'direct' });
    }

    // Use scraping method for search
    const pageNum = parseInt(page, 10) || 1;
    const searchResults = await searchYouTubeByScraping(query, filter, pageNum);

    // Store videos in our cache
    for (const video of searchResults) {
      await storage.createVideo(video);
    }

    res.json({ videos: searchResults, channels: [] });
  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
}