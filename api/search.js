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

// Advanced web scraping function for YouTube search (matches original backend)
async function searchYouTubeByScraping(query, filter = 'relevant', page = 1) {
  // Map filter to YouTube sort parameters
  const sortMap = {
    'relevant': '',
    'latest': '&sp=CAI%253D',
    'popular': '&sp=CAMSAhAB',
    'duration': '&sp=EgIYAw%253D%253D'
  };

  const sortParam = sortMap[filter] || '';

  // Calculate offset for pagination
  let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sortParam}`;

  if (page > 1) {
    searchUrl += `&gl=US&hl=en&start=${(page - 1) * 20}`;
  }

  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`YouTube scraping error: ${response.status}`);
  }

  const html = await response.text();

  // Extract both video and channel data from the page
  const videos = [];
  const channels = [];

  // Look for data in script tags
  const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  if (scriptMatches) {
    for (const scriptTag of scriptMatches) {
      const content = scriptTag.replace(/<\/?script[^>]*>/gi, '');
      if (content && content.includes('var ytInitialData')) {
        try {
          // Extract the JSON data
          const match = content.match(/var ytInitialData = ({.*?});/);
          if (match) {
            const data = JSON.parse(match[1]);
            const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

            if (contents) {
              for (const section of contents) {
                const items = section?.itemSectionRenderer?.contents;
                if (items) {
                  for (const item of items) {
                    // Handle video results
                    if (item.videoRenderer) {
                      const video = item.videoRenderer;

                      // Try multiple paths for channel avatar
                      let channelAvatarUrl = null;

                      // Method 1: channelThumbnailSupportedRenderers
                      if (video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url) {
                        channelAvatarUrl = video.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url;
                      }
                      // Method 2: channelId and construct generic avatar URL
                      else if (video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId) {
                        const channelId = video.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;
                        channelAvatarUrl = `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`; // Default, will be enhanced
                      }

                      videos.push({
                        id: video.videoId,
                        title: video.title?.runs?.[0]?.text || video.title?.simpleText || 'Untitled',
                        description: video.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
                        channelTitle: video.longBylineText?.runs?.[0]?.text || video.ownerText?.runs?.[0]?.text || 'Unknown Channel',
                        channelId: video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || video.longBylineText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?.split('/')?.[2] || '',
                        channelAvatarUrl,
                        thumbnailUrl: video.thumbnail?.thumbnails?.[0]?.url,
                        duration: video.lengthText?.simpleText || '',
                        viewCount: video.viewCountText?.simpleText || '',
                        publishedAt: video.publishedTimeText?.simpleText || '',
                        type: 'video'
                      });
                    }
                    // Handle channel results
                    else if (item.channelRenderer) {
                      const channel = item.channelRenderer;

                      channels.push({
                        id: channel.channelId,
                        title: channel.title?.simpleText || 'Unknown Channel',
                        description: channel.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
                        channelTitle: channel.title?.simpleText || 'Unknown Channel',
                        channelId: channel.channelId,
                        channelAvatarUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                        thumbnailUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                        duration: null,
                        viewCount: null,
                        publishedAt: null,
                        subscriberCount: channel.subscriberCountText?.simpleText || '',
                        videoCount: channel.videoCountText?.runs?.map(r => r.text).join('') || '',
                        type: 'channel'
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (e) {
          // Ignore parsing errors and continue
        }
      }
    }
  }

  // For pagination, adjust the results based on page
  let channelLimit = page === 1 ? 2 : 0; // Only show channels on first page
  let videoLimit = page === 1 ? 48 : 50; // More videos on subsequent pages

  // Combine and sort results - channels first, then videos
  const combinedResults = [
    ...channels.slice(0, channelLimit),
    ...videos.slice(0, videoLimit)
  ];

  return combinedResults.slice(0, 50); // Total limit of 50 results per page
}

// Get video details from oEmbed API\nasync function getVideoDetailsFromOEmbed(videoId) {\n  try {\n    const oembedData = await getOEmbedData(videoId);\n\n    if (!oembedData) {\n      return undefined;\n    }\n\n    // Try to fetch channel avatar by scraping the video page\n    let channelAvatarUrl = null;\n    try {\n      channelAvatarUrl = await getChannelAvatarFromVideoPage(videoId);\n    } catch (e) {\n      console.log('Could not fetch channel avatar from video page');\n    }\n\n    return {\n      id: videoId,\n      title: oembedData.title,\n      description: null, // oEmbed doesn't provide description\n      channelTitle: oembedData.author_name,\n      channelId: '', // oEmbed doesn't provide channel ID\n      channelAvatarUrl,\n      thumbnailUrl: oembedData.thumbnail_url || null,\n      duration: null, // oEmbed doesn't provide duration\n      viewCount: null, // oEmbed doesn't provide view count\n      publishedAt: null // oEmbed doesn't provide publish date\n    };\n  } catch (error) {\n    console.error('oEmbed error:', error);\n    return undefined;\n  }\n}\n\nasync function getOEmbedData(videoId) {\n  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;\n\n  const response = await fetch(url);\n  if (!response.ok) {\n    throw new Error(`oEmbed API error: ${response.status}`);\n  }\n\n  return response.json();\n}\n\n// Function to get channel avatar by scraping the video page\nasync function getChannelAvatarFromVideoPage(videoId) {\n  try {\n    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;\n    const response = await fetch(videoUrl, {\n      headers: {\n        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'\n      }\n    });\n\n    if (!response.ok) {\n      return null;\n    }\n\n    const html = await response.text();\n\n    // Look for channel avatar URL patterns in the HTML\n    const avatarRegexes = [\n      // Match yt3.ggpht.com avatar URLs\n      /https:\\/\\/yt3\\.ggpht\\.com\\/[^\"'\\s]+/g,\n      // Match channel thumbnail URLs\n      /\"avatar\":{\"thumbnails\":\\[{\"url\":\"([^\"]+)\"/g,\n      // Match owner profile image\n      /\"ownerProfileUrl\":\"[^\"]*\",\"thumbnail\":{\"thumbnails\":\\[{\"url\":\"([^\"]+)\"/g\n    ];\n\n    for (const regex of avatarRegexes) {\n      const matches = html.match(regex);\n      if (matches && matches.length > 0) {\n        // Find the first match that looks like a channel avatar\n        for (const match of matches) {\n          if (match.includes('yt3.ggpht.com') && !match.includes('default-user') && match.includes('s88')) {\n            return match.replace(/['\"]/g, '');\n          }\n        }\n      }\n    }\n\n    // Fallback: try to extract channel ID and construct generic avatar URL\n    const channelIdMatch = html.match(/\"channelId\":\"([^\"]+)\"/);\n    if (channelIdMatch && channelIdMatch[1]) {\n      return `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`;\n    }\n\n    return null;\n  } catch (error) {\n    console.log('Failed to fetch channel avatar:', error);\n    return null;\n  }\n}\n\nexport default async function handler(req, res) {
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
      // For direct URLs, always use oEmbed method
      const videoDetails = await getVideoDetailsFromOEmbed(videoId);
      if (videoDetails) {
        await storage.createVideo(videoDetails);
        return res.json({ videos: [videoDetails], type: 'direct' });
      }
    }

    // Use scraping method for search
    const pageNum = parseInt(page, 10) || 1;
    const searchResults = await searchYouTubeByScraping(query, filter, pageNum);

    // Store videos in our cache
    for (const video of searchResults) {
      await storage.createVideo(video);
    }

    const channels = searchResults.filter(item => item.type === 'channel');
    const videos = searchResults.filter(item => item.type === 'video' || !item.type);
    
    res.json({ videos, channels });
  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
}