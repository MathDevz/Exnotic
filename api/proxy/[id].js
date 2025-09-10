// Get video oEmbed data
async function getOEmbedData(videoId) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`oEmbed API error: ${response.status}`);
  }

  return response.json();
}

// Function to get channel avatar by scraping the video page
async function getChannelAvatarFromVideoPage(videoId) {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Look for channel avatar URL patterns in the HTML
    const avatarRegexes = [
      // Match yt3.ggpht.com avatar URLs
      /https:\/\/yt3\.ggpht\.com\/[^"'\s]+/g,
      // Match channel thumbnail URLs
      /"avatar":{"thumbnails":\[{"url":"([^"]+)"/g,
      // Match owner profile image
      /"ownerProfileUrl":"[^"]*","thumbnail":{"thumbnails":\[{"url":"([^"]+)"/g
    ];

    for (const regex of avatarRegexes) {
      const matches = html.match(regex);
      if (matches && matches.length > 0) {
        // Find the first match that looks like a channel avatar
        for (const match of matches) {
          if (match.includes('yt3.ggpht.com') && !match.includes('default-user') && match.includes('s88')) {
            return match.replace(/['"]/g, '');
          }
        }
      }
    }

    // Fallback: try to extract channel ID and construct generic avatar URL
    const channelIdMatch = html.match(/"channelId":"([^"]+)"/);
    if (channelIdMatch && channelIdMatch[1]) {
      return `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`;
    }

    return null;
  } catch (error) {
    console.log('Failed to fetch channel avatar:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // First try to get real video metadata using oEmbed
    let videoData = {
      id: id,
      title: "Video Player",
      description: null,
      channelTitle: "YouTube",
      channelId: "",
      channelAvatarUrl: null,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      duration: null,
      viewCount: null,
      publishedAt: null
    };

    try {
      const oembedData = await getOEmbedData(id);
      videoData = {
        id: id,
        title: oembedData.title,
        description: null,
        channelTitle: oembedData.author_name,
        channelId: "",
        channelAvatarUrl: null,
        thumbnailUrl: oembedData.thumbnail_url || `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        duration: null,
        viewCount: null,
        publishedAt: null
      };
    } catch (e) {
      console.log('Could not fetch oEmbed data for proxy method, using defaults');
    }

    const proxyData = {
      ...videoData,
      useProxy: true,
      proxyMethods: [
        `https://www.youtube-nocookie.com/embed/${id}`,
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`,
        `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&fs=1&playsinline=1`
      ]
    };

    // Try to get channel avatar
    let channelAvatarUrl = null;
    if (proxyData.channelId || id) {
      channelAvatarUrl = await getChannelAvatarFromVideoPage(id);
    }
    res.json({ ...proxyData, channelAvatarUrl, useProxy: true });

  } catch (error) {
    console.error('Proxy endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch video data' });
  }
}