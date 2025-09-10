// Simple in-memory storage for serverless functions
class MemStorage {
  constructor() {
    this.videos = new Map();
    this.searchQueries = [];
  }

  async createVideo(video) {
    this.videos.set(video.id, video);
    return video;
  }

  async createSearchQuery(query) {
    this.searchQueries.push(query);
    return query;
  }

  async getVideo(id) {
    return this.videos.get(id) || null;
  }

  async getAllVideos() {
    return Array.from(this.videos.values());
  }

  async getRecentSearches() {
    // Return the last 10 searches
    return this.searchQueries.slice(-10).reverse();
  }
}

// Create a singleton instance
export const storage = new MemStorage();