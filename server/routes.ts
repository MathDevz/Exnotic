import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertSearchQuerySchema, type YouTubeOEmbedResponse } from "@shared/schema";
import * as cheerio from 'cheerio';

// Invidious instance URLs (public instances that bypass YouTube blocks)
const INVIDIOUS_INSTANCES = [
  'https://inv.vern.cc',
  'https://invidious.lunar.icu',
  'https://vid.puffyan.us',
  'https://invidious.privacydev.net',
  'https://inv.odyssey346.dev',
  'https://invidious.slipfox.xyz',
  'https://invidious.weblibre.org',
  'https://iv.ggtyler.dev'
];

export async function registerRoutes(app: Express): Promise<Server> {

  // Search videos endpoint
  app.get("/api/search", async (req, res) => {
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
      const pageNum = parseInt(page as string, 10) || 1;
      const searchResults = await searchYouTubeByScraping(query, filter as string, pageNum);

      // Store videos in our cache
      for (const video of searchResults) {
        await storage.createVideo(video);
      }

      res.json({ videos: searchResults, type: 'search' });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search videos" });
    }
  });

  // Get video details endpoint
  app.get("/api/video/:id", async (req, res) => {
    try {
      const { id } = req.params;
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
  });

  // Get video oEmbed data
  app.get("/api/oembed/:id", async (req, res) => {
    try {
      const { id } = req.params;
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
  });

  // Get Invidious video stream (bypasses YouTube blocks)
  app.get("/api/invidious/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const invidiousData = await getInvidiousVideoData(id);
      if (invidiousData.invidiousInstance) {
        // Try to get channel avatar
        let channelAvatarUrl = null;
        if (invidiousData.authorId || id) {
          channelAvatarUrl = await getChannelAvatarFromVideoPage(id);
        }
        return res.json({ ...invidiousData, channelAvatarUrl, useInvidious: true });
      }
      res.json(invidiousData);
    } catch (error) {
      console.error("Invidious fetch error:", error);
      res.status(500).json({ error: "Failed to fetch video from Invidious" });
    }
  });

  // Alternative proxy method using direct YouTube-nocookie embed
  app.get("/api/proxy/:id", async (req, res) => {
    try {
      const { id } = req.params;

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
      console.error("Proxy fetch error:", error);
      res.status(500).json({ error: "Failed to create proxy embed" });
    }
  });

  // Channel endpoint for accurate channel data
  app.get("/api/channel", async (req, res) => {
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
  });

  // Get recent searches
  app.get("/api/searches/recent", async (req, res) => {
    try {
      const recentSearches = await storage.getRecentSearches();
      res.json(recentSearches);
    } catch (error) {
      console.error("Recent searches error:", error);
      res.status(500).json({ error: "Failed to fetch recent searches" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

async function searchYouTubeByScraping(query: string, filter: string = 'relevant', page: number = 1) {
  // Map filter to YouTube sort parameters
  const sortMap: { [key: string]: string } = {
    'relevant': '',
    'latest': '&sp=CAI%253D',
    'popular': '&sp=CAMSAhAB',
    'duration': '&sp=EgIYAw%253D%253D'
  };

  const sortParam = sortMap[filter] || '';

  // Calculate offset for pagination (YouTube uses continuation tokens, but we'll simulate pagination)
  // For page 1, use normal URL, for subsequent pages, we'll need to handle differently
  let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sortParam}`;

  // For pagination, we'll simulate by adding different search terms or using continuation
  // This is a simplification - in reality, YouTube uses continuation tokens
  if (page > 1) {
    // Add a slight variation to get different results (not perfect but workable)
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
  const $ = cheerio.load(html);

  // Extract both video and channel data from the page
  const videos: any[] = [];
  const channels: any[] = [];

  // Look for data in script tags
  $('script').each((i, elem) => {
    const content = $(elem).html();
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
                      description: video.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
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
                      description: channel.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
                      channelTitle: channel.title?.simpleText || 'Unknown Channel',
                      channelId: channel.channelId,
                      channelAvatarUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                      thumbnailUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                      duration: null,
                      viewCount: null,
                      publishedAt: null,
                      subscriberCount: channel.subscriberCountText?.simpleText || '',
                      videoCount: channel.videoCountText?.runs?.map((r: any) => r.text).join('') || '',
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
  });

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

async function getVideoDetailsFromOEmbed(videoId: string) {
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

async function getOEmbedData(videoId: string): Promise<YouTubeOEmbedResponse> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`oEmbed API error: ${response.status}`);
  }

  return response.json();
}

// Function to get channel avatar by scraping the video page
async function getChannelAvatarFromVideoPage(videoId: string): Promise<string | null> {
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

// Get video data from Invidious (bypasses YouTube blocks)
async function getInvidiousVideoData(videoId: string) {
  let lastError;

  // Try multiple Invidious instances until one works
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ExnoticApp/1.0)'
        }
      });

      if (!response.ok) {
        throw new Error(`Invidious API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        id: videoId,
        title: data.title,
        description: data.description || null,
        channelTitle: data.author,
        channelId: data.authorId || '',
        channelAvatarUrl: data.authorThumbnails?.[0]?.url || null,
        thumbnailUrl: data.videoThumbnails?.[0]?.url || null,
        duration: formatSeconds(data.lengthSeconds),
        viewCount: data.viewCount ? `${data.viewCount.toLocaleString()} views` : null,
        publishedAt: data.published ? formatTimestamp(data.published) : null,
        // Invidious-specific data for ad-free streaming
        invidiousInstance: instance,
        videoStreams: data.formatStreams || [],
        adaptiveFormats: data.adaptiveFormats || []
      };
    } catch (error) {
      console.log(`Failed to fetch from ${instance}:`, error);
      lastError = error;
      continue;
    }
  }

  throw new Error(`All Invidious instances failed. Last error: ${lastError}`);
}

// Helper function to format seconds to duration string
function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "1 day ago";
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

// Search specifically for channels (not videos)
async function searchForChannel(channelName: string) {
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
    const $ = cheerio.load(html);

    // Extract channel data from the page
    let channelData = null;
    let bestMatch = null;
    let exactMatch = null;

    $('script').each((i, elem) => {
      const content = $(elem).html();
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
                      const channelId = channel.channelId;
                      const channelTitle = channel.title?.simpleText || '';

                      if (channelId) {
                        // Get the best quality avatar URL
                        let avatarUrl = null;
                        if (channel.thumbnail?.thumbnails.length > 0) {
                          // Get the highest quality thumbnail
                          const thumbnails = channel.thumbnail.thumbnails;
                          avatarUrl = thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url;
                        }

                        const candidate = {
                          channelId,
                          name: channelTitle || 'Unknown Channel',
                          avatarUrl,
                          description: channel.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
                          subscriberCount: channel.subscriberCountText?.simpleText || '',
                          videoCount: channel.videoCountText?.runs?.map((r: any) => r.text).join('') || ''
                        };

                        // Check for exact match (case insensitive)
                        if (channelTitle.toLowerCase() === channelName.toLowerCase()) {
                          exactMatch = candidate;
                          break;
                        }

                        // Check for close match (contains the search term)
                        if (channelTitle.toLowerCase().includes(channelName.toLowerCase()) ||
                            channelName.toLowerCase().includes(channelTitle.toLowerCase())) {
                          if (!bestMatch) {
                            bestMatch = candidate;
                          }
                        }

                        // Fallback to first channel found
                        if (!channelData) {
                          channelData = candidate;
                        }
                      }
                    }
                  }
                }
                if (exactMatch) break;
              }
            }
          }
        } catch (e) {
          // Continue searching
        }
      }
    });

    // Prioritize exact match, then best match, then any channel found
    const finalChannelData = exactMatch || bestMatch || channelData;

    if (finalChannelData) {
      // Now get videos for this specific channel
      const videosResult = await getChannelVideos(finalChannelData.channelId);
      
      // Handle both array and object returns from getChannelVideos
      let videos = [];
      if (Array.isArray(videosResult)) {
        videos = videosResult;
      } else if (videosResult && videosResult.videos) {
        videos = videosResult.videos;
      }
      
      return {
        channel: finalChannelData,
        videos: videos
      };
    }

    return null;
  } catch (error) {
    console.error('Channel search error:', error);
    return null;
  }
}

// Get channel data by channel ID
async function getChannelDataById(channelId: string) {
  try {
    // Get videos for this channel first
    const videosResult = await getChannelVideos(channelId);

    let videos = [];
    let channelData = null;

    // Handle both array and object returns from getChannelVideos
    if (Array.isArray(videosResult)) {
      videos = videosResult;
    } else if (videosResult && videosResult.videos) {
      videos = videosResult.videos;
      channelData = videosResult.channelInfo;
    }

    // Try to get additional channel metadata from the channel page if we don't have enough info
    if (!channelData || !channelData.avatarUrl || !channelData.subscriberCount) {
      const channelUrl = `https://www.youtube.com/channel/${channelId}`;

      try {
        const response = await fetch(channelUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);

          // Extract channel metadata
          $('script').each((i, elem) => {
            const content = $(elem).html();
            if (content && content.includes('var ytInitialData')) {
              try {
                const match = content.match(/var ytInitialData = ({.*?});/);
                if (match) {
                  const data = JSON.parse(match[1]);
                  const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;

                  if (header) {
                    const pageChannelData = {
                      channelId,
                      name: header.title?.simpleText || header.title?.runs?.[0]?.text || 'Unknown Channel',
                      avatarUrl: header.avatar?.thumbnails?.[header.avatar.thumbnails.length - 1]?.url || null,
                      description: header.tagline?.simpleText || '',
                      subscriberCount: header.subscriberCountText?.simpleText || '',
                      videoCount: (videos && videos.length ? videos.length.toString() : '0')
                    };

                    // Merge with existing channel data
                    if (channelData) {
                      channelData = {
                        ...channelData,
                        name: channelData.name !== 'Unknown Channel' ? channelData.name : pageChannelData.name,
                        avatarUrl: channelData.avatarUrl || pageChannelData.avatarUrl,
                        description: channelData.description || pageChannelData.description,
                        subscriberCount: channelData.subscriberCount || pageChannelData.subscriberCount,
                        videoCount: (videos && videos.length ? videos.length.toString() : '0')
                      };
                    } else {
                      channelData = pageChannelData;
                    }
                  }
                }
              } catch (e) {
                // Continue
              }
            }
          });
        }
      } catch (e) {
        console.log('Failed to fetch additional channel data from main page');
      }
    }

    // If we still don't have channel data, create it from videos
    if (!channelData && videos.length > 0) {
      const firstVideo = videos[0];
      channelData = {
        channelId,
        name: firstVideo.channelTitle || 'Unknown Channel',
        avatarUrl: firstVideo.channelAvatarUrl,
        description: '',
        subscriberCount: '',
        videoCount: (videos && videos.length ? videos.length.toString() : '0')
      };
    }

    if (channelData) {
      return {
        channel: channelData,
        videos: videos
      };
    }

    return null;
  } catch (error) {
    console.error('Channel fetch by ID error:', error);
    return null;
  }
}

// Get videos specifically from a channel using channel ID
async function getChannelVideos(channelId: string) {
  // Try multiple URL formats for better compatibility
  const urls = [
    `https://www.youtube.com/channel/${channelId}/videos`,
    `https://www.youtube.com/@${channelId}/videos`,
    `https://www.youtube.com/c/${channelId}/videos`,
    `https://www.youtube.com/user/${channelId}/videos`
  ];

  for (const channelUrl of urls) {
    try {
      const response = await fetch(channelUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        console.log(`Failed to fetch from ${channelUrl}: ${response.status}`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const videos: any[] = [];
      let channelInfo = {
        channelId: channelId,
        name: 'Unknown Channel',
        avatarUrl: null,
        subscriberCount: '',
        description: ''
      };

      // Extract video data from the channel page
      $('script').each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes('var ytInitialData')) {
          try {
            const match = content.match(/var ytInitialData = ({.*?});/);
            if (match) {
              const data = JSON.parse(match[1]);

              // Extract channel metadata - try multiple sources
              const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
              const metadata = data?.metadata?.channelMetadataRenderer;

              // Use header data first
              if (header) {
                channelInfo.name = header.title?.simpleText || header.title?.runs?.[0]?.text || channelInfo.name;
                channelInfo.description = header.tagline?.simpleText || channelInfo.description;
                channelInfo.subscriberCount = header.subscriberCountText?.simpleText || header.subscriberCountText?.runs?.[0]?.text || channelInfo.subscriberCount;
                if (header.avatar?.thumbnails?.length > 0) {
                  channelInfo.avatarUrl = header.avatar.thumbnails[header.avatar.thumbnails.length - 1].url;
                }
              }

              // Fallback to metadata
              if (metadata && (!channelInfo.name || channelInfo.name === 'Unknown Channel')) {
                channelInfo.name = metadata.title || channelInfo.name;
                channelInfo.description = metadata.description || channelInfo.description;
                if (metadata.avatar?.thumbnails?.length > 0) {
                  channelInfo.avatarUrl = metadata.avatar.thumbnails[metadata.avatar.thumbnails.length - 1].url;
                }
              }

              // Navigate through the complex YouTube data structure for videos
              const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
              if (tabs) {
                for (const tab of tabs) {
                  const tabRenderer = tab.tabRenderer;
                  if (tabRenderer && (tabRenderer.title === 'Videos' || tabRenderer.selected)) {
                    const content = tabRenderer.content;
                    const items = content?.richGridRenderer?.contents || content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items;

                    if (items) {
                      for (const item of items) {
                        const videoRenderer = item.richItemRenderer?.content?.videoRenderer || item.gridVideoRenderer;
                        if (videoRenderer && videoRenderer.videoId) {
                          videos.push({
                            id: videoRenderer.videoId,
                            title: videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || 'Untitled',
                            description: videoRenderer.descriptionSnippet?.runs?.map((r: any) => r.text).join('') || '',
                            channelTitle: channelInfo.name,
                            channelId: channelId,
                            channelAvatarUrl: channelInfo.avatarUrl,
                            thumbnailUrl: videoRenderer.thumbnail?.thumbnails?.[videoRenderer.thumbnail.thumbnails.length - 1]?.url || videoRenderer.thumbnail?.thumbnails?.[0]?.url,
                            duration: videoRenderer.lengthText?.simpleText || videoRenderer.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || '',
                            viewCount: videoRenderer.viewCountText?.simpleText || videoRenderer.shortViewCountText?.simpleText || '',
                            publishedAt: videoRenderer.publishedTimeText?.simpleText || ''
                          });
                        }
                      }
                    }
                    break;
                  }
                }
              }
            }
          } catch (e) {
            console.log('Error parsing YouTube data:', e);
          }
        }
      });

      if (videos.length > 0 || channelInfo.name !== 'Unknown Channel') {
        return {
          channelInfo: channelInfo,
          videos: videos.slice(0, 200)
        };
      }
    } catch (error) {
      console.log(`Error fetching from ${channelUrl}:`, error);
      continue;
    }
  }

  console.error('Failed to fetch channel videos from all URL formats');
  return {
    channelInfo: {
      channelId: channelId,
      name: 'Unknown Channel',
      avatarUrl: null,
      subscribers: '',
      description: ''
    },
    videos: []
  };
}