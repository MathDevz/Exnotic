// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  videos;
  searchQueries;
  constructor() {
    this.videos = /* @__PURE__ */ new Map();
    this.searchQueries = /* @__PURE__ */ new Map();
  }
  async getVideo(id) {
    return this.videos.get(id);
  }
  async createVideo(insertVideo) {
    const video = {
      ...insertVideo,
      description: insertVideo.description ?? null,
      thumbnailUrl: insertVideo.thumbnailUrl ?? null,
      duration: insertVideo.duration ?? null,
      viewCount: insertVideo.viewCount ?? null,
      publishedAt: insertVideo.publishedAt ?? null
    };
    this.videos.set(video.id, video);
    return video;
  }
  async searchVideos(query) {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.videos.values()).filter(
      (video) => video.title.toLowerCase().includes(lowercaseQuery) || video.description?.toLowerCase().includes(lowercaseQuery) || video.channelTitle.toLowerCase().includes(lowercaseQuery)
    );
  }
  async createSearchQuery(insertSearchQuery) {
    const id = randomUUID();
    const searchQuery = { ...insertSearchQuery, id };
    this.searchQueries.set(id, searchQuery);
    return searchQuery;
  }
  async getRecentSearches() {
    return Array.from(this.searchQueries.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  }
};
var storage = new MemStorage();

// server/routes.ts
import * as cheerio from "cheerio";
var INVIDIOUS_INSTANCES = [
  "https://inv.vern.cc",
  "https://invidious.lunar.icu",
  "https://vid.puffyan.us",
  "https://invidious.privacydev.net",
  "https://inv.odyssey346.dev",
  "https://invidious.slipfox.xyz",
  "https://invidious.weblibre.org",
  "https://iv.ggtyler.dev"
];
async function registerRoutes(app2) {
  app2.get("/api/search", async (req, res) => {
    try {
      const { q: query, method = "scraping", filter = "relevant", page = "1" } = req.query;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter is required" });
      }
      await storage.createSearchQuery({
        query,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      const videoId = extractVideoId(query);
      if (videoId) {
        const videoDetails = await getVideoDetailsFromOEmbed(videoId);
        if (videoDetails) {
          await storage.createVideo(videoDetails);
          return res.json({ videos: [videoDetails], type: "direct" });
        }
      }
      const pageNum = parseInt(page, 10) || 1;
      const searchResults = await searchYouTubeByScraping(query, filter, pageNum);
      for (const video of searchResults) {
        await storage.createVideo(video);
      }
      res.json({ videos: searchResults, type: "search" });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search videos" });
    }
  });
  app2.get("/api/video/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { method = "oembed" } = req.query;
      let video = await storage.getVideo(id);
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
  app2.get("/api/oembed/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const oembedData = await getOEmbedData(id);
      let channelAvatarUrl = null;
      if (oembedData.author_name || oembedData.title) {
        channelAvatarUrl = await getChannelAvatarFromVideoPage(id);
      }
      res.json({ ...oembedData, channelAvatarUrl });
    } catch (error) {
      console.error("oEmbed fetch error:", error);
      res.status(500).json({ error: "Failed to fetch video embed data" });
    }
  });
  app2.get("/api/invidious/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const invidiousData = await getInvidiousVideoData(id);
      if (invidiousData.invidiousInstance) {
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
  app2.get("/api/proxy/:id", async (req, res) => {
    try {
      const { id } = req.params;
      let videoData = {
        id,
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
          id,
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
        console.log("Could not fetch oEmbed data for proxy method, using defaults");
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
  app2.get("/api/channel", async (req, res) => {
    try {
      const { q: query, channelId, id } = req.query;
      const actualChannelId = channelId || id;
      console.log("Channel endpoint called with:", { query, channelId, id, actualChannelId });
      if (!query && !actualChannelId) {
        return res.status(400).json({ error: "Channel query or ID is required" });
      }
      let result;
      if (actualChannelId && typeof actualChannelId === "string" && actualChannelId.startsWith("UC")) {
        console.log("Fetching channel by ID:", actualChannelId);
        result = await getChannelDataById(actualChannelId);
      }
      if (!result && query && typeof query === "string") {
        console.log("Searching for channel by name:", query);
        result = await searchForChannel(query);
      }
      if (!result && actualChannelId && typeof actualChannelId === "string" && !actualChannelId.startsWith("UC")) {
        console.log("Searching for channel by actualChannelId as name:", actualChannelId);
        result = await searchForChannel(actualChannelId);
      }
      console.log("Channel result:", result ? "Found" : "Not found");
      if (result && (result.videos !== void 0 || result.channel || result.channelInfo)) {
        const channelData = result.channel || result.channelInfo;
        const videos = result.videos || [];
        const response = {
          channel: {
            channelId: channelData?.channelId || actualChannelId || "",
            name: channelData?.name || "Unknown Channel",
            avatarUrl: channelData?.avatarUrl || null,
            description: channelData?.description || "",
            subscriberCount: channelData?.subscriberCount || channelData?.subscribers || "",
            videoCount: channelData?.videoCount || (videos && videos.length ? videos.length.toString() : "0")
          },
          videos
        };
        console.log("Returning channel data:", response.channel?.name, "with", response.videos.length, "videos");
        res.json(response);
      } else {
        console.log("Channel not found");
        res.status(404).json({ error: "Channel not found" });
      }
    } catch (error) {
      console.error("Channel fetch error:", error);
      res.status(500).json({ error: "Failed to fetch channel data", details: error.message });
    }
  });
  app2.get("/api/searches/recent", async (req, res) => {
    try {
      const recentSearches = await storage.getRecentSearches();
      res.json(recentSearches);
    } catch (error) {
      console.error("Recent searches error:", error);
      res.status(500).json({ error: "Failed to fetch recent searches" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function extractVideoId(url) {
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
async function searchYouTubeByScraping(query, filter = "relevant", page = 1) {
  const sortMap = {
    "relevant": "",
    "latest": "&sp=CAI%253D",
    "popular": "&sp=CAMSAhAB",
    "duration": "&sp=EgIYAw%253D%253D"
  };
  const sortParam = sortMap[filter] || "";
  let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}${sortParam}`;
  if (page > 1) {
    searchUrl += `&gl=US&hl=en&start=${(page - 1) * 20}`;
  }
  const response = await fetch(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
  });
  if (!response.ok) {
    throw new Error(`YouTube scraping error: ${response.status}`);
  }
  const html = await response.text();
  const $ = cheerio.load(html);
  const videos = [];
  const channels = [];
  $("script").each((i, elem) => {
    const content = $(elem).html();
    if (content && content.includes("var ytInitialData")) {
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
                  if (item.videoRenderer) {
                    const video = item.videoRenderer;
                    let channelAvatarUrl = null;
                    if (video.channelThumbnailSupportedRenderers?.channelThumbnailWithLinkRenderer?.thumbnail?.thumbnails?.[0]?.url) {
                      channelAvatarUrl = video.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails[0].url;
                    } else if (video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId) {
                      const channelId = video.longBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId;
                      channelAvatarUrl = `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`;
                    }
                    videos.push({
                      id: video.videoId,
                      title: video.title?.runs?.[0]?.text || video.title?.simpleText || "Untitled",
                      description: video.descriptionSnippet?.runs?.map((r) => r.text).join("") || "",
                      channelTitle: video.longBylineText?.runs?.[0]?.text || video.ownerText?.runs?.[0]?.text || "Unknown Channel",
                      channelId: video.longBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || video.longBylineText?.runs?.[0]?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url?.split("/")?.[2] || "",
                      channelAvatarUrl,
                      thumbnailUrl: video.thumbnail?.thumbnails?.[0]?.url,
                      duration: video.lengthText?.simpleText || "",
                      viewCount: video.viewCountText?.simpleText || "",
                      publishedAt: video.publishedTimeText?.simpleText || "",
                      type: "video"
                    });
                  } else if (item.channelRenderer) {
                    const channel = item.channelRenderer;
                    channels.push({
                      id: channel.channelId,
                      title: channel.title?.simpleText || "Unknown Channel",
                      description: channel.descriptionSnippet?.runs?.map((r) => r.text).join("") || "",
                      channelTitle: channel.title?.simpleText || "Unknown Channel",
                      channelId: channel.channelId,
                      channelAvatarUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                      thumbnailUrl: channel.thumbnail?.thumbnails?.[0]?.url || null,
                      duration: null,
                      viewCount: null,
                      publishedAt: null,
                      subscriberCount: channel.subscriberCountText?.simpleText || "",
                      videoCount: channel.videoCountText?.runs?.map((r) => r.text).join("") || "",
                      type: "channel"
                    });
                  }
                }
              }
            }
          }
        }
      } catch (e) {
      }
    }
  });
  let channelLimit = page === 1 ? 2 : 0;
  let videoLimit = page === 1 ? 48 : 50;
  const combinedResults = [
    ...channels.slice(0, channelLimit),
    ...videos.slice(0, videoLimit)
  ];
  return combinedResults.slice(0, 50);
}
async function getVideoDetailsFromOEmbed(videoId) {
  try {
    const oembedData = await getOEmbedData(videoId);
    if (!oembedData) {
      return void 0;
    }
    let channelAvatarUrl = null;
    try {
      channelAvatarUrl = await getChannelAvatarFromVideoPage(videoId);
    } catch (e) {
      console.log("Could not fetch channel avatar from video page");
    }
    return {
      id: videoId,
      title: oembedData.title,
      description: null,
      // oEmbed doesn't provide description
      channelTitle: oembedData.author_name,
      channelId: "",
      // oEmbed doesn't provide channel ID
      channelAvatarUrl,
      thumbnailUrl: oembedData.thumbnail_url || null,
      duration: null,
      // oEmbed doesn't provide duration
      viewCount: null,
      // oEmbed doesn't provide view count
      publishedAt: null
      // oEmbed doesn't provide publish date
    };
  } catch (error) {
    console.error("oEmbed error:", error);
    return void 0;
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
async function getChannelAvatarFromVideoPage(videoId) {
  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
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
        for (const match of matches) {
          if (match.includes("yt3.ggpht.com") && !match.includes("default-user") && match.includes("s88")) {
            return match.replace(/['"]/g, "");
          }
        }
      }
    }
    const channelIdMatch = html.match(/"channelId":"([^"]+)"/);
    if (channelIdMatch && channelIdMatch[1]) {
      return `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`;
    }
    return null;
  } catch (error) {
    console.log("Failed to fetch channel avatar:", error);
    return null;
  }
}
async function getInvidiousVideoData(videoId) {
  let lastError;
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; ExnoticApp/1.0)"
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
        channelId: data.authorId || "",
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
function formatSeconds(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1e3);
  const now = /* @__PURE__ */ new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  if (diffDays === 1) {
    return "1 day ago";
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
}
async function searchForChannel(channelName) {
  let searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(channelName)}&sp=EgIQAg%253D%253D`;
  try {
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`YouTube channel search error: ${response.status}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    let channelData = null;
    let bestMatch = null;
    let exactMatch = null;
    $("script").each((i, elem) => {
      const content = $(elem).html();
      if (content && content.includes("var ytInitialData")) {
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
                      const channelTitle = channel.title?.simpleText || "";
                      if (channelId) {
                        let avatarUrl = null;
                        if (channel.thumbnail?.thumbnails.length > 0) {
                          const thumbnails = channel.thumbnail.thumbnails;
                          avatarUrl = thumbnails[thumbnails.length - 1]?.url || thumbnails[0]?.url;
                        }
                        const candidate = {
                          channelId,
                          name: channelTitle || "Unknown Channel",
                          avatarUrl,
                          description: channel.descriptionSnippet?.runs?.map((r) => r.text).join("") || "",
                          subscriberCount: channel.subscriberCountText?.simpleText || "",
                          videoCount: channel.videoCountText?.runs?.map((r) => r.text).join("") || ""
                        };
                        if (channelTitle.toLowerCase() === channelName.toLowerCase()) {
                          exactMatch = candidate;
                          break;
                        }
                        if (channelTitle.toLowerCase().includes(channelName.toLowerCase()) || channelName.toLowerCase().includes(channelTitle.toLowerCase())) {
                          if (!bestMatch) {
                            bestMatch = candidate;
                          }
                        }
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
        }
      }
    });
    const finalChannelData = exactMatch || bestMatch || channelData;
    if (finalChannelData) {
      const videosResult = await getChannelVideos(finalChannelData.channelId);
      let videos = [];
      if (Array.isArray(videosResult)) {
        videos = videosResult;
      } else if (videosResult && videosResult.videos) {
        videos = videosResult.videos;
      }
      return {
        channel: finalChannelData,
        videos
      };
    }
    return null;
  } catch (error) {
    console.error("Channel search error:", error);
    return null;
  }
}
async function getChannelDataById(channelId) {
  try {
    const videosResult = await getChannelVideos(channelId);
    let videos = [];
    let channelData = null;
    if (Array.isArray(videosResult)) {
      videos = videosResult;
    } else if (videosResult && videosResult.videos) {
      videos = videosResult.videos;
      channelData = videosResult.channelInfo;
    }
    if (!channelData || !channelData.avatarUrl || !channelData.subscriberCount) {
      const channelUrl = `https://www.youtube.com/channel/${channelId}`;
      try {
        const response = await fetch(channelUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });
        if (response.ok) {
          const html = await response.text();
          const $ = cheerio.load(html);
          $("script").each((i, elem) => {
            const content = $(elem).html();
            if (content && content.includes("var ytInitialData")) {
              try {
                const match = content.match(/var ytInitialData = ({.*?});/);
                if (match) {
                  const data = JSON.parse(match[1]);
                  const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
                  if (header) {
                    const pageChannelData = {
                      channelId,
                      name: header.title?.simpleText || header.title?.runs?.[0]?.text || "Unknown Channel",
                      avatarUrl: header.avatar?.thumbnails?.[header.avatar.thumbnails.length - 1]?.url || null,
                      description: header.tagline?.simpleText || "",
                      subscriberCount: header.subscriberCountText?.simpleText || "",
                      videoCount: videos && videos.length ? videos.length.toString() : "0"
                    };
                    if (channelData) {
                      channelData = {
                        ...channelData,
                        name: channelData.name !== "Unknown Channel" ? channelData.name : pageChannelData.name,
                        avatarUrl: channelData.avatarUrl || pageChannelData.avatarUrl,
                        description: channelData.description || pageChannelData.description,
                        subscriberCount: channelData.subscriberCount || pageChannelData.subscriberCount,
                        videoCount: videos && videos.length ? videos.length.toString() : "0"
                      };
                    } else {
                      channelData = pageChannelData;
                    }
                  }
                }
              } catch (e) {
              }
            }
          });
        }
      } catch (e) {
        console.log("Failed to fetch additional channel data from main page");
      }
    }
    if (!channelData && videos.length > 0) {
      const firstVideo = videos[0];
      channelData = {
        channelId,
        name: firstVideo.channelTitle || "Unknown Channel",
        avatarUrl: firstVideo.channelAvatarUrl,
        description: "",
        subscriberCount: "",
        videoCount: videos && videos.length ? videos.length.toString() : "0"
      };
    }
    if (channelData) {
      return {
        channel: channelData,
        videos
      };
    }
    return null;
  } catch (error) {
    console.error("Channel fetch by ID error:", error);
    return null;
  }
}
async function getChannelVideos(channelId) {
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
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      if (!response.ok) {
        console.log(`Failed to fetch from ${channelUrl}: ${response.status}`);
        continue;
      }
      const html = await response.text();
      const $ = cheerio.load(html);
      const videos = [];
      let channelInfo = {
        channelId,
        name: "Unknown Channel",
        avatarUrl: null,
        subscriberCount: "",
        description: ""
      };
      $("script").each((i, elem) => {
        const content = $(elem).html();
        if (content && content.includes("var ytInitialData")) {
          try {
            const match = content.match(/var ytInitialData = ({.*?});/);
            if (match) {
              const data = JSON.parse(match[1]);
              const header = data?.header?.c4TabbedHeaderRenderer || data?.header?.pageHeaderRenderer;
              const metadata = data?.metadata?.channelMetadataRenderer;
              if (header) {
                channelInfo.name = header.title?.simpleText || header.title?.runs?.[0]?.text || channelInfo.name;
                channelInfo.description = header.tagline?.simpleText || channelInfo.description;
                channelInfo.subscriberCount = header.subscriberCountText?.simpleText || header.subscriberCountText?.runs?.[0]?.text || channelInfo.subscriberCount;
                if (header.avatar?.thumbnails?.length > 0) {
                  channelInfo.avatarUrl = header.avatar.thumbnails[header.avatar.thumbnails.length - 1].url;
                }
              }
              if (metadata && (!channelInfo.name || channelInfo.name === "Unknown Channel")) {
                channelInfo.name = metadata.title || channelInfo.name;
                channelInfo.description = metadata.description || channelInfo.description;
                if (metadata.avatar?.thumbnails?.length > 0) {
                  channelInfo.avatarUrl = metadata.avatar.thumbnails[metadata.avatar.thumbnails.length - 1].url;
                }
              }
              const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
              if (tabs) {
                for (const tab of tabs) {
                  const tabRenderer = tab.tabRenderer;
                  if (tabRenderer && (tabRenderer.title === "Videos" || tabRenderer.selected)) {
                    const content2 = tabRenderer.content;
                    const items = content2?.richGridRenderer?.contents || content2?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.gridRenderer?.items;
                    if (items) {
                      for (const item of items) {
                        const videoRenderer = item.richItemRenderer?.content?.videoRenderer || item.gridVideoRenderer;
                        if (videoRenderer && videoRenderer.videoId) {
                          videos.push({
                            id: videoRenderer.videoId,
                            title: videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || "Untitled",
                            description: videoRenderer.descriptionSnippet?.runs?.map((r) => r.text).join("") || "",
                            channelTitle: channelInfo.name,
                            channelId,
                            channelAvatarUrl: channelInfo.avatarUrl,
                            thumbnailUrl: videoRenderer.thumbnail?.thumbnails?.[videoRenderer.thumbnail.thumbnails.length - 1]?.url || videoRenderer.thumbnail?.thumbnails?.[0]?.url,
                            duration: videoRenderer.lengthText?.simpleText || videoRenderer.thumbnailOverlays?.[0]?.thumbnailOverlayTimeStatusRenderer?.text?.simpleText || "",
                            viewCount: videoRenderer.viewCountText?.simpleText || videoRenderer.shortViewCountText?.simpleText || "",
                            publishedAt: videoRenderer.publishedTimeText?.simpleText || ""
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
            console.log("Error parsing YouTube data:", e);
          }
        }
      });
      if (videos.length > 0 || channelInfo.name !== "Unknown Channel") {
        return {
          channelInfo,
          videos: videos.slice(0, 200)
        };
      }
    } catch (error) {
      console.log(`Error fetching from ${channelUrl}:`, error);
      continue;
    }
  }
  console.error("Failed to fetch channel videos from all URL formats");
  return {
    channelInfo: {
      channelId,
      name: "Unknown Channel",
      avatarUrl: null,
      subscribers: "",
      description: ""
    },
    videos: []
  };
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
