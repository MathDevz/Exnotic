import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/search-bar";
import VideoCard from "@/components/video-card";
import LoadingScreen from "@/components/loading-screen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Video as VideoIcon, Heart, Clock } from "lucide-react";
import { extractVideoId } from "@/lib/youtube-utils";
import { addSearchHistory, cacheVideosForRecommendations, refreshRecommendations } from "@/lib/user-data";
import { useUserData } from "@/contexts/UserDataContext";
import type { Video } from "@shared/schema";

export default function SearchResults() {
  const [location, setLocation] = useLocation();
  const { isVideoInWatchLater, isVideoInFavorites, toggleWatchLater, toggleFavorite } = useUserData();

  // Use window.location.search for more reliable query parameter parsing
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('q') || '';
  const method = (searchParams.get('method') as 'scraping' | 'oembed') || 'scraping';
  const filter = searchParams.get('filter') || 'relevant';
  const [searchQuery, setSearchQuery] = useState(query);
  const [page, setPage] = useState(1);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  
  // Action button handlers
  const handleWatchLater = (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    toggleWatchLater({
      id: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      addedAt: new Date().toISOString()
    });
  };

  const handleFavorite = (e: React.MouseEvent, video: any) => {
    e.stopPropagation();
    toggleFavorite({
      id: video.id,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      duration: video.duration,
      addedAt: new Date().toISOString()
    });
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', query, method, filter, page],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&method=${method}&filter=${filter}&page=${page}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result as { videos: Video[]; type: 'search' | 'direct' };
    },
    enabled: !!query,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  // Load more videos query
  const { data: moreData, isLoading: isLoadingMore, refetch: loadMore } = useQuery({
    queryKey: ['search-more', query, method, filter, page],
    queryFn: async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&method=${method}&filter=${filter}&page=${page}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      return result as { videos: Video[]; type: 'search' | 'direct' };
    },
    enabled: page > 1,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Update searchQuery when URL changes and reset pagination
  useEffect(() => {
    setSearchQuery(query);
    setPage(1);
    setAllVideos([]);
    setHasMoreVideos(true);
  }, [query, method, filter]);

  // Handle initial data load
  useEffect(() => {
    if (data?.videos && page === 1) {
      setAllVideos(data.videos);
      setHasMoreVideos(true); // Always assume there are more results initially
      
      // Track search for recommendations
      addSearchHistory(query, data.videos.length);
      cacheVideosForRecommendations(data.videos);
      refreshRecommendations();
    }
  }, [data, page, query]);

  // Handle loading more data
  useEffect(() => {
    if (moreData?.videos && page > 1) {
      setAllVideos(prev => {
        // Prevent duplicates when loading more
        const existingIds = new Set(prev.map(video => video.id));
        const uniqueNewVideos = moreData.videos.filter((video: any) => !existingIds.has(video.id));
        return [...prev, ...uniqueNewVideos];
      });
      // Force more results - much lower threshold and always assume more exist for first few pages
      setHasMoreVideos(page < 5 || moreData.videos.length >= 5); // Force load more for first 5 pages or if we get any results
    }
  }, [moreData, page]);

  useEffect(() => {
    // If it's a direct video URL, redirect to video player
    if (data?.type === 'direct' && data.videos.length > 0) {
      setLocation(`/watch/${data.videos[0].id}`);
    }
  }, [data, setLocation]);

  const handleSearch = (newQuery: string) => {
    if (newQuery.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(newQuery.trim())}&method=${method}&filter=${filter}`;
      window.location.href = searchUrl;
    }
  };

  const handleFilterChange = (newFilter: string) => {
    const searchUrl = `/search?q=${encodeURIComponent(query)}&method=${method}&filter=${newFilter}`;
    window.location.href = searchUrl;
  };

  const handleVideoClick = (videoId: string) => {
    setLocation(`/watch/${videoId}`);
  };

  const handleChannelClick = (channelId: string, channelTitle: string) => {
    if (channelId && channelId !== 'undefined' && channelId !== 'null' && channelId.trim() !== '' && channelId.startsWith('UC')) {
      setLocation(`/channel/${channelId}`);
    } else if (channelTitle && channelTitle !== 'Unknown Channel') {
      setLocation(`/channel/name/${encodeURIComponent(channelTitle)}`);
    }
  };

  const handleLoadMore = () => {
    if (hasMoreVideos && !isLoadingMore) {
      setPage(prev => prev + 1);
      // Trigger the loadMore query with current search parameters
      loadMore();
    }
  };

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">Search Failed</p>
          <p className="text-muted-foreground mb-6">
            {error.message || "Something went wrong while searching for videos"}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()}>Retry Search</Button>
            <Button variant="outline" onClick={() => setLocation('/')}>Go Home</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">Search Results</h2>
              <Badge variant={method === 'scraping' ? 'default' : 'secondary'} className="text-xs">
                {method === 'scraping' ? 'Scraping' : 'oEmbed'}
              </Badge>
              {method === 'scraping' && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort:</span>
                  <Select value={filter} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevant">Most Relevant</SelectItem>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="duration">Duration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {allVideos.length > 0 && (
              <p className="text-muted-foreground">
                Showing <span className="text-foreground font-medium">{allVideos.length} videos</span> for "
                <span className="text-primary">{query}</span>"
              </p>
            )}
          </div>

          <div className="max-w-md w-full md:w-auto">
            <SearchBar
              onSearch={handleSearch}
              placeholder="Search again..."
              initialValue={searchQuery}
              compact
            />
          </div>
        </div>
      </div>


      {/* Results */}
      <div className="space-y-6">
        {isLoading ? (
          <LoadingScreen type="search" message="Searching for videos..." />
        ) : allVideos.length > 0 ? (
          <>
            {/* Separate channels and videos */}
            {(() => {
              const channels = allVideos.filter((item: any) => item.type === 'channel');
              const videos = allVideos.filter((item: any) => item.type === 'video');

              return (
                <>
                  {/* Channels Section */}
                  {channels.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Channels
                      </h3>
                      <div className="space-y-4">
                        {channels.map((channel: any) => (
                          <div
                            key={channel.id}
                            className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/80 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => handleChannelClick(channel.channelId, channel.channelTitle)}
                          >
                            <div className="md:flex">
                              <div className="md:w-32 md:h-32 flex-shrink-0 bg-secondary flex items-center justify-center">
                                {channel.channelAvatarUrl ? (
                                  <img
                                    src={channel.channelAvatarUrl}
                                    alt={`${channel.channelTitle} avatar`}
                                    className="w-full h-full object-cover rounded-full md:w-20 md:h-20"
                                  />
                                ) : (
                                  <User className="w-12 h-12 text-muted-foreground" />
                                )}
                              </div>
                              <div className="p-6 flex-1">
                                <h4 className="text-lg font-semibold mb-2 text-foreground hover:text-primary transition-colors">
                                  {channel.channelTitle}
                                </h4>
                                {channel.description && (
                                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                    {channel.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  {channel.subscriberCount && (
                                    <span>{channel.subscriberCount}</span>
                                  )}
                                  {channel.videoCount && (
                                    <span>{channel.videoCount}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Section */}
                  {videos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <VideoIcon className="w-5 h-5" />
                        Videos
                      </h3>
                      <div className="space-y-6">
                        {videos.map((video: any) => (
                          <div
                            key={video.id}
                            className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/80 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => handleVideoClick(video.id)}
                          >
                            <div className="md:flex">
                              <div className="md:w-80 md:h-48 flex-shrink-0 bg-secondary relative group">
                                {video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={`${video.title} thumbnail`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-secondary flex items-center justify-center">
                                    <span className="text-muted-foreground">No thumbnail</span>
                                  </div>
                                )}
                                {video.duration && (
                                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-sm px-2 py-1 rounded">
                                    {video.duration}
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 p-0 bg-black/80 hover:bg-black/60 border-0"
                                    onClick={(e) => handleWatchLater(e, video)}
                                    title={isVideoInWatchLater(video.id) ? "Remove from Watch Later" : "Add to Watch Later"}
                                    data-testid={`button-watch-later-${video.id}`}
                                  >
                                    <Clock className={`w-3 h-3 ${isVideoInWatchLater(video.id) ? 'text-primary' : 'text-white'}`} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-8 w-8 p-0 bg-black/80 hover:bg-black/60 border-0"
                                    onClick={(e) => handleFavorite(e, video)}
                                    title={isVideoInFavorites(video.id) ? "Remove from Favorites" : "Add to Favorites"}
                                    data-testid={`button-favorite-${video.id}`}
                                  >
                                    <Heart className={`w-3 h-3 ${isVideoInFavorites(video.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
                                  </Button>
                                </div>
                              </div>
                              <div className="p-6 flex-1">
                                <h4 className="text-lg font-semibold mb-2 text-foreground hover:text-primary transition-colors line-clamp-2">
                                  {video.title}
                                </h4>
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-primary flex-shrink-0">
                                    {video.channelAvatarUrl ? (
                                      <img
                                        src={video.channelAvatarUrl}
                                        alt={video.channelTitle}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-primary-foreground font-semibold text-sm">${video.channelTitle.charAt(0).toUpperCase()}</span>`;
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className="text-primary-foreground font-semibold text-sm">
                                        {video.channelTitle.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleChannelClick(video.channelId, video.channelTitle);
                                       }}>
                                      {video.channelTitle}
                                    </p>
                                    <div className="flex items-center text-muted-foreground text-xs space-x-2">
                                      {video.viewCount && <span>{video.viewCount}</span>}
                                      {video.viewCount && video.publishedAt && <span>•</span>}
                                      {video.publishedAt && <span>{video.publishedAt}</span>}
                                    </div>
                                  </div>
                                </div>
                                {video.description && (
                                  <p className="text-muted-foreground text-sm line-clamp-3">
                                    {video.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Show More Button */}
            {method === 'scraping' && !isLoading && allVideos.length > 0 && page <= 10 && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                  className="px-8 py-3"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      Loading More...
                    </>
                  ) : page > 10 ? (
                    'Reached Search Limit'
                  ) : (
                    'Show More Results'
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">No videos found</p>
            <p className="text-sm text-muted-foreground">Try searching with different keywords</p>
          </div>
        )}
      </div>
    </main>
  );
}