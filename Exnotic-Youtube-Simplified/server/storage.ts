import { type Video, type InsertVideo, type SearchQuery, type InsertSearchQuery } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Video operations
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  searchVideos(query: string): Promise<Video[]>;
  
  // Search query operations
  createSearchQuery(searchQuery: InsertSearchQuery): Promise<SearchQuery>;
  getRecentSearches(): Promise<SearchQuery[]>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video>;
  private searchQueries: Map<string, SearchQuery>;

  constructor() {
    this.videos = new Map();
    this.searchQueries = new Map();
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const video: Video = { 
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

  async searchVideos(query: string): Promise<Video[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.videos.values()).filter(
      (video) => 
        video.title.toLowerCase().includes(lowercaseQuery) ||
        video.description?.toLowerCase().includes(lowercaseQuery) ||
        video.channelTitle.toLowerCase().includes(lowercaseQuery)
    );
  }

  async createSearchQuery(insertSearchQuery: InsertSearchQuery): Promise<SearchQuery> {
    const id = randomUUID();
    const searchQuery: SearchQuery = { ...insertSearchQuery, id };
    this.searchQueries.set(id, searchQuery);
    return searchQuery;
  }

  async getRecentSearches(): Promise<SearchQuery[]> {
    return Array.from(this.searchQueries.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }
}

export const storage = new MemStorage();
