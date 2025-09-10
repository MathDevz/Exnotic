import { storage } from "../_storage.js";

// Get video details from oEmbed API
async function getVideoDetailsFromOEmbed(videoId) {
  try {
    const oembedData = await getOEmbedData(videoId);

    if (!oembedData) {
      return undefined;
    }

    // Try to fetch channel avatar by scraping the video page
    let channelAvatarUrl = null;
    try {
      channelAvatarUrl = await getChannelAvatarFromVideoPage(videoId);
    } catch (e) {
      console.log('Could not fetch channel avatar from video page');
    }

    return {
      id: videoId,
      title: oembedData.title,
      description: null, // oEmbed doesn't provide description
      channelTitle: oembedData.author_name,
      channelId: '', // oEmbed doesn't provide channel ID
      channelAvatarUrl,
      thumbnailUrl: oembedData.thumbnail_url || null,
      duration: null, // oEmbed doesn't provide duration
      viewCount: null, // oEmbed doesn't provide view count
      publishedAt: null // oEmbed doesn't provide publish date
    };
  } catch (error) {
    console.error('oEmbed error:', error);
    return undefined;
  }
}

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
    const { method = 'oembed' } = req.query;

    // Try to get from storage first
    let video = await storage.getVideo(id);

    // If not in storage, fetch from YouTube using specified method
    if (!video) {
      video = await getVideoDetailsFromOEmbed(id);
      if (video) {
        await storage.createVideo(video);
      }
    }

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(video);
  } catch (error) {
    console.error("Video fetch error:", error);
    res.status(500).json({ error: "Failed to fetch video details" });
  }
}