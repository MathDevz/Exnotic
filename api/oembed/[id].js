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
    const oembedData = await getOEmbedData(id);

    // Try to get channel avatar
    let channelAvatarUrl = null;
    if (oembedData.author_name || oembedData.title) { // Check if data is available
      channelAvatarUrl = await getChannelAvatarFromVideoPage(id);
    }

    res.json({ ...oembedData, channelAvatarUrl });
  } catch (error) {
    console.error("oEmbed fetch error:", error);
    res.status(500).json({ error: "Failed to fetch video embed data" });
  }
}