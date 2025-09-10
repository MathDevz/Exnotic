
export interface WatchProgress {
  videoId: string;
  currentTime: number;
  duration: number;
  timestamp: string;
}

export interface WatchLaterVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  duration: string | null;
  addedAt: string;
}

export interface FavoriteVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  duration: string | null;
  addedAt: string;
}

export interface VideoBookmark {
  videoId: string;
  timestamp: number;
  note: string;
  createdAt: string;
}

export interface SearchSuggestion {
  query: string;
  count: number;
  lastUsed: string;
}

export interface SearchHistory {
  query: string;
  timestamp: string;
  resultCount: number;
}

export interface RecentVideo {
  id: string;
  title: string;
  description: string | null;
  channelTitle: string;
  channelId: string;
  thumbnailUrl: string | null;
  duration: string | null;
  viewCount: string | null;
  publishedAt: string | null;
  watchedAt: string;
}

// Watch Progress Management
export const saveWatchProgress = (videoId: string, currentTime: number, duration: number) => {
  const progress: WatchProgress = {
    videoId,
    currentTime,
    duration,
    timestamp: new Date().toISOString()
  };

  const existing = localStorage.getItem('exnotic-watch-progress');
  const progressMap = existing ? JSON.parse(existing) : {};
  progressMap[videoId] = progress;

  localStorage.setItem('exnotic-watch-progress', JSON.stringify(progressMap));
};

export const getWatchProgress = (videoId: string): WatchProgress | null => {
  const existing = localStorage.getItem('exnotic-watch-progress');
  if (!existing) return null;

  const progressMap = JSON.parse(existing);
  return progressMap[videoId] || null;
};

export const getAllWatchProgress = (): WatchProgress[] => {
  const existing = localStorage.getItem('exnotic-watch-progress');
  if (!existing) return [];

  const progressMap = JSON.parse(existing);
  return Object.values(progressMap);
};

// Watch Later Management
export const addToWatchLater = (video: WatchLaterVideo) => {
  const existing = localStorage.getItem('exnotic-watch-later');
  const watchLater = existing ? JSON.parse(existing) : [];

  // Remove if already exists
  const filtered = watchLater.filter((v: WatchLaterVideo) => v.id !== video.id);
  filtered.unshift({ ...video, addedAt: new Date().toISOString() });

  localStorage.setItem('exnotic-watch-later', JSON.stringify(filtered));
};

export const removeFromWatchLater = (videoId: string) => {
  const existing = localStorage.getItem('exnotic-watch-later');
  if (!existing) return;

  const watchLater = JSON.parse(existing);
  const filtered = watchLater.filter((v: WatchLaterVideo) => v.id !== videoId);

  localStorage.setItem('exnotic-watch-later', JSON.stringify(filtered));
};

export const getWatchLater = (): WatchLaterVideo[] => {
  const existing = localStorage.getItem('exnotic-watch-later');
  return existing ? JSON.parse(existing) : [];
};

export const isInWatchLater = (videoId: string): boolean => {
  const watchLater = getWatchLater();
  return watchLater.some(v => v.id === videoId);
};

// Favorites Management
export const addToFavorites = (video: FavoriteVideo) => {
  const existing = localStorage.getItem('exnotic-favorites');
  const favorites = existing ? JSON.parse(existing) : [];

  // Remove if already exists
  const filtered = favorites.filter((v: FavoriteVideo) => v.id !== video.id);
  filtered.unshift({ ...video, addedAt: new Date().toISOString() });

  localStorage.setItem('exnotic-favorites', JSON.stringify(filtered));
};

export const removeFromFavorites = (videoId: string) => {
  const existing = localStorage.getItem('exnotic-favorites');
  if (!existing) return;

  const favorites = JSON.parse(existing);
  const filtered = favorites.filter((v: FavoriteVideo) => v.id !== videoId);

  localStorage.setItem('exnotic-favorites', JSON.stringify(filtered));
};

export const getFavorites = (): FavoriteVideo[] => {
  const existing = localStorage.getItem('exnotic-favorites');
  return existing ? JSON.parse(existing) : [];
};

export const isInFavorites = (videoId: string): boolean => {
  const favorites = getFavorites();
  return favorites.some(v => v.id === videoId);
};

// Recently Viewed Management
export const getRecentVideos = (): RecentVideo[] => {
  try {
    const recent = localStorage.getItem('exnotic-recent-videos');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
};

export const getContinueWatchingVideos = () => {
  const recentVideos = getRecentVideos();
  const watchProgress = getAllWatchProgress();
  
  return recentVideos
    .map(video => {
      const progress = watchProgress.find(p => p.videoId === video.id);
      if (progress && progress.currentTime > 30 && progress.currentTime < (progress.duration * 0.9)) {
        return { ...video, progress };
      }
      return null;
    })
    .filter((video): video is RecentVideo & { progress: WatchProgress } => video !== null)
    .slice(0, 8);
};

export const clearRecentVideos = () => {
  localStorage.removeItem('exnotic-recent-videos');
};

// Bookmarks Management
export const addBookmark = (videoId: string, timestamp: number, note: string) => {
  const bookmark: VideoBookmark = {
    videoId,
    timestamp,
    note,
    createdAt: new Date().toISOString()
  };

  const existing = localStorage.getItem('exnotic-bookmarks');
  const bookmarks = existing ? JSON.parse(existing) : [];
  bookmarks.push(bookmark);

  localStorage.setItem('exnotic-bookmarks', JSON.stringify(bookmarks));
};

export const getBookmarks = (videoId: string): VideoBookmark[] => {
  const existing = localStorage.getItem('exnotic-bookmarks');
  if (!existing) return [];

  const bookmarks = JSON.parse(existing);
  return bookmarks.filter((b: VideoBookmark) => b.videoId === videoId);
};

export const removeBookmark = (videoId: string, timestamp: number) => {
  const existing = localStorage.getItem('exnotic-bookmarks');
  if (!existing) return;

  const bookmarks = JSON.parse(existing);
  const filtered = bookmarks.filter((b: VideoBookmark) => 
    !(b.videoId === videoId && b.timestamp === timestamp)
  );

  localStorage.setItem('exnotic-bookmarks', JSON.stringify(filtered));
};

// Search Suggestions Management
export const addSearchSuggestion = (query: string) => {
  const existing = localStorage.getItem('exnotic-search-suggestions');
  const suggestions = existing ? JSON.parse(existing) : {};

  if (suggestions[query]) {
    suggestions[query].count++;
    suggestions[query].lastUsed = new Date().toISOString();
  } else {
    suggestions[query] = {
      query,
      count: 1,
      lastUsed: new Date().toISOString()
    };
  }

  localStorage.setItem('exnotic-search-suggestions', JSON.stringify(suggestions));
};

export const getSearchSuggestions = (query: string): string[] => {
  const existing = localStorage.getItem('exnotic-search-suggestions');
  if (!existing) return [];

  const suggestions = JSON.parse(existing);
  const matches = Object.values(suggestions)
    .filter((s: any) => s.query.toLowerCase().includes(query.toLowerCase()) && s.query !== query)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 5)
    .map((s: any) => s.query);

  return matches;
};

export const getRecentSearches = (): string[] => {
  const existing = localStorage.getItem('exnotic-search-suggestions');
  if (!existing) return [];

  const suggestions = JSON.parse(existing);
  return Object.values(suggestions)
    .sort((a: any, b: any) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
    .slice(0, 10)
    .map((s: any) => s.query);
};

export const clearSearchHistory = () => {
  localStorage.removeItem('exnotic-search-suggestions');
};

// Search History for Recommendations
export const addSearchHistory = (query: string, resultCount: number = 0) => {
  const searchEntry: SearchHistory = {
    query,
    timestamp: new Date().toISOString(),
    resultCount
  };

  const existing = localStorage.getItem('exnotic-search-history');
  const history = existing ? JSON.parse(existing) : [];
  
  // Remove duplicate queries and add new one at the beginning
  const filtered = history.filter((h: SearchHistory) => h.query.toLowerCase() !== query.toLowerCase());
  filtered.unshift(searchEntry);
  
  // Keep only last 50 searches
  const trimmed = filtered.slice(0, 50);
  
  localStorage.setItem('exnotic-search-history', JSON.stringify(trimmed));
};

export const getSearchHistory = (): SearchHistory[] => {
  const existing = localStorage.getItem('exnotic-search-history');
  return existing ? JSON.parse(existing) : [];
};

// Recommendation System
export const getRecommendedVideos = (): any[] => {
  try {
    // Get user's search history to base recommendations on
    const searchHistory = getSearchHistory();
    const recentVideos = getRecentVideos();
    
    if (searchHistory.length === 0) {
      return [];
    }

    // Extract keywords from recent searches (weighted by recency)
    const keywords = searchHistory
      .slice(0, 15) // Use last 15 searches for better variety
      .map((h, index) => ({
        query: h.query.toLowerCase(),
        weight: 15 - index // More recent searches get higher weight
      }))
      .flatMap(h => h.query.split(' ').map(word => ({ word, weight: h.weight })))
      .filter(item => item.word.length > 2) // Filter short words
      .slice(0, 30); // More keywords for better matching

    // Get stored trending/search results that might match user interests
    const stored = localStorage.getItem('exnotic-recommendation-cache');
    const cachedVideos = stored ? JSON.parse(stored) : [];
    
    // Score and filter cached videos based on user's interests
    const scoredVideos = cachedVideos.map((video: any) => {
      const title = video.title?.toLowerCase() || '';
      const channel = video.channelTitle?.toLowerCase() || '';
      const description = video.description?.toLowerCase() || '';
      
      let score = 0;
      keywords.forEach(({ word, weight }) => {
        if (title.includes(word)) score += weight * 3; // Title matches are most important
        if (channel.includes(word)) score += weight * 2; // Channel matches are important
        if (description.includes(word)) score += weight * 1; // Description matches help
      });
      
      return { ...video, score };
    })
    .filter(video => video.score > 0)
    .sort((a, b) => b.score - a.score) // Sort by relevance score
    .slice(0, 16); // Get top 16 recommendations

    // Add some variety by mixing in recent trending videos
    const remainingSlots = 16 - scoredVideos.length;
    if (remainingSlots > 0) {
      const trendingVideos = cachedVideos
        .filter(video => !scoredVideos.some(scored => scored.id === video.id))
        .slice(0, remainingSlots);
      scoredVideos.push(...trendingVideos);
    }

    return scoredVideos.slice(0, 12); // Final limit to 12 recommendations
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
};

// Trigger recommendation refresh
export const refreshRecommendations = () => {
  // This will be called after each search to update recommendations
  window.dispatchEvent(new CustomEvent('recommendationsUpdated'));
};

// Add related videos based on user interaction (like favorite or watch later)
export const addRelatedVideosToCache = async (video: any) => {
  try {
    // Search for related videos based on the video title and channel
    const searchTerms = [
      video.channelTitle,
      ...video.title.split(' ').filter((word: string) => word.length > 3).slice(0, 3)
    ];
    
    for (const term of searchTerms) {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}&method=scraping&filter=relevant&page=1`);
        if (response.ok) {
          const data = await response.json();
          if (data.videos && data.videos.length > 0) {
            // Filter out the current video and cache the related ones
            const relatedVideos = data.videos
              .filter((v: any) => v.id !== video.id)
              .slice(0, 5); // Limit to 5 related videos per search term
            
            cacheVideosForRecommendations(relatedVideos);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch related videos for term: ${term}`, error);
      }
    }
  } catch (error) {
    console.error('Error adding related videos to cache:', error);
  }
};

// Cache videos for recommendations (to be called when fetching trending/search results)
export const cacheVideosForRecommendations = (videos: any[]) => {
  try {
    const existing = localStorage.getItem('exnotic-recommendation-cache');
    const currentCache = existing ? JSON.parse(existing) : [];
    
    // Add new videos to cache, avoiding duplicates
    const newVideos = videos.filter(video => 
      !currentCache.some((cached: any) => cached.id === video.id)
    );
    
    const updatedCache = [...currentCache, ...newVideos].slice(0, 200); // Keep max 200 videos
    
    localStorage.setItem('exnotic-recommendation-cache', JSON.stringify(updatedCache));
  } catch (error) {
    console.error('Error caching videos for recommendations:', error);
  }
};
