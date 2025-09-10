// Search specifically for channels (not videos)
async function searchForChannel(channelName) {
  // First try to search for the exact channel name
  let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(channelName)}&sp=EgIQAg%253D%253D`; // sp parameter filters for channels only

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`YouTube channel search error: ${response.status}`);
    }

    const html = await response.text();

    // Extract channel data from the page
    let channelData = null;
    let bestMatch = null;
    let exactMatch = null;

    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
    if (scriptMatches) {
      for (const scriptTag of scriptMatches) {
        const content = scriptTag.replace(/<\/?script[^>]*>/gi, '');
        if (content && content.includes('var ytInitialData')) {
          try {
            const match = content.match(/var ytInitialData = ({.*?});/);
            if (match) {
              const data = JSON.parse(match[1]);
              const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

              if (contents) {
                for (const section of contents) {
                  const items = section?.itemSectionRenderer?.contents;
                  if (items) {
                    for (const item of items) {
                      if (item.channelRenderer) {
                        const channel = item.channelRenderer;
                        
                        const channelTitle = channel.title?.simpleText || 'Unknown Channel';
                        const channelId = channel.channelId;
                        
                        // Create channel data object
                        const channelInfo = {
                          channelId: channelId,
                          name: channelTitle,
                          avatarUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                          description: channel.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
                          subscriberCount: channel.subscriberCountText?.simpleText || '',
                          videoCount: channel.videoCountText?.runs?.map(r => r.text).join('') || ''
                        };

                        // Check for exact match first
                        if (channelTitle.toLowerCase() === channelName.toLowerCase()) {
                          exactMatch = { channel: channelInfo, videos: [] };
                          break;
                        }
                        
                        // Keep track of the best partial match
                        if (channelTitle.toLowerCase().includes(channelName.toLowerCase()) || 
                            channelName.toLowerCase().includes(channelTitle.toLowerCase())) {
                          if (!bestMatch) {
                            bestMatch = { channel: channelInfo, videos: [] };
                          }
                        }
                        
                        // If no better match yet, use this one
                        if (!channelData) {
                          channelData = { channel: channelInfo, videos: [] };
                        }
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

    // Return the best match we found
    return exactMatch || bestMatch || channelData;

  } catch (error) {
    console.error('Channel search error:', error);
    return null;
  }
}

// Get channel data by ID
async function getChannelDataById(channelId) {
  try {
    // Try to get channel data by visiting the channel page directly
    const channelUrl = `https://www.youtube.com/channel/${channelId}`;
    const response = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Channel page error: ${response.status}`);
    }

    const html = await response.text();

    // Extract channel data from the page
    let channelInfo = null;
    const videos = [];

    const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
    if (scriptMatches) {
      for (const scriptTag of scriptMatches) {
        const content = scriptTag.replace(/<\/?script[^>]*>/gi, '');
        if (content && content.includes('var ytInitialData')) {
          try {
            const match = content.match(/var ytInitialData = ({.*?});/);
            if (match) {
              const data = JSON.parse(match[1]);
              
              // Extract channel metadata
              const header = data?.header?.c4TabbedHeaderRenderer;
              if (header) {
                channelInfo = {
                  channelId: channelId,
                  name: header.title || 'Unknown Channel',
                  avatarUrl: header.avatar?.thumbnails?.[0]?.url || null,
                  description: '',
                  subscriberCount: header.subscriberCountText?.simpleText || '',
                  videoCount: ''
                };
              }

              // Extract video data from the channel
              const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
              if (contents) {
                for (const tab of contents) {
                  const tabContent = tab?.tabRenderer?.content?.richGridRenderer?.contents;
                  if (tabContent) {
                    for (const item of tabContent) {
                      if (item.richItemRenderer?.content?.videoRenderer) {
                        const video = item.richItemRenderer.content.videoRenderer;
                        videos.push({
                          id: video.videoId,
                          title: video.title?.runs?.[0]?.text || video.title?.simpleText || 'Untitled',
                          description: video.descriptionSnippet?.runs?.map(r => r.text).join('') || '',
                          channelTitle: channelInfo?.name || 'Unknown Channel',
                          channelId: channelId,
                          channelAvatarUrl: channelInfo?.avatarUrl,
                          thumbnailUrl: video.thumbnail?.thumbnails?.[0]?.url,
                          duration: video.lengthText?.simpleText || '',
                          viewCount: video.viewCountText?.simpleText || '',
                          publishedAt: video.publishedTimeText?.simpleText || ''
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

    if (channelInfo) {
      return { channel: channelInfo, videos: videos.slice(0, 30) }; // Limit to 30 videos
    }

    return null;
  } catch (error) {
    console.error('Channel by ID error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  try {
    const { q: query, channelId, id } = req.query;
    
    // Normalize the channel identifier
    const actualChannelId = channelId || id;

    console.log('Channel endpoint called with:', { query, channelId, id, actualChannelId });

    if (!query && !actualChannelId) {
      return res.status(400).json({ error: "Channel query or ID is required" });
    }

    let result;

    // If we have a channelId that looks like a YouTube channel ID (starts with UC), try to get channel data by ID first
    if (actualChannelId && typeof actualChannelId === 'string' && actualChannelId.startsWith('UC')) {
      console.log('Fetching channel by ID:', actualChannelId);
      result = await getChannelDataById(actualChannelId);
    }

    // If no result from ID, or if we have a query, search for channel
    if (!result && query && typeof query === 'string') {
      console.log('Searching for channel by name:', query);
      result = await searchForChannel(query);
    }

    // If still no result and actualChannelId looks like a name, try searching with it
    if (!result && actualChannelId && typeof actualChannelId === 'string' && !actualChannelId.startsWith('UC')) {
      console.log('Searching for channel by actualChannelId as name:', actualChannelId);
      result = await searchForChannel(actualChannelId);
    }

    console.log('Channel result:', result ? 'Found' : 'Not found');

    if (result && (result.videos !== undefined || result.channel || result.channelInfo)) {
      // Ensure consistent return format and proper channel data
      const channelData = result.channel || result.channelInfo;
      const videos = result.videos || [];

      // Ensure channel has proper data
      const response = {
        channel: {
          channelId: channelData?.channelId || actualChannelId || '',
          name: channelData?.name || 'Unknown Channel',
          avatarUrl: channelData?.avatarUrl || null,
          description: channelData?.description || '',
          subscriberCount: channelData?.subscriberCount || channelData?.subscribers || '',
          videoCount: channelData?.videoCount || (videos && videos.length ? videos.length.toString() : '0')
        },
        videos: videos
      };
      console.log('Returning channel data:', response.channel?.name, 'with', response.videos.length, 'videos');
      res.json(response);
    } else {
      console.log('Channel not found');
      res.status(404).json({ error: "Channel not found" });
    }
  } catch (error) {
    console.error("Channel fetch error:", error);
    res.status(500).json({ error: "Failed to fetch channel data", details: error.message });
  }
}