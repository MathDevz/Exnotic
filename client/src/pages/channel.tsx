import React, { useState, useEffect, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LoadingScreen from "@/components/loading-screen";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Video as VideoIcon, Calendar, Filter, Eye, ChevronDown } from "lucide-react";
import VideoCard from "@/components/video-card";
import type { Video } from "@shared/schema";

export default function Channel() {
  const { channelId, channelName } = useParams<{ channelId?: string; channelName?: string }>();
  
  // Handle both /channel/:id and /channel/name/:name routes
  const isNameRoute = window.location.pathname.includes('/channel/name/');
  const actualChannelId = isNameRoute ? undefined : channelId;
  const actualChannelName = isNameRoute ? channelName : undefined;
  const [, setLocation] = useLocation();
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'oldest'>('latest');
  const [filterDuration, setFilterDuration] = useState<'all' | 'short' | 'medium' | 'long'>('all');

  const [channelPage, setChannelPage] = useState(1);
  const [allChannelVideos, setAllChannelVideos] = useState<any[]>([]);
  const [hasMoreChannelVideos, setHasMoreChannelVideos] = useState(true);

  // Decode channel name if it was URL encoded
  const decodedChannelName = channelName ? decodeURIComponent(channelName) : '';

  const { data: channelData, isLoading, error } = useQuery({
    queryKey: ['channel', actualChannelId, actualChannelName, isNameRoute],
    queryFn: async () => {
      let url = '/api/channel?';

      // Handle channel ID route (starts with UC)
      if (actualChannelId && actualChannelId !== 'undefined' && actualChannelId !== 'null' && actualChannelId.startsWith('UC')) {
        url += `channelId=${encodeURIComponent(actualChannelId)}`;
      }
      // Handle channel name route
      else if (actualChannelName && actualChannelName !== 'undefined' && actualChannelName !== 'null') {
        const decodedName = decodeURIComponent(actualChannelName);
        url += `q=${encodeURIComponent(decodedName)}`;
      }
      // Handle fallback for non-UC channelId (treat as name)
      else if (actualChannelId && actualChannelId !== 'undefined' && actualChannelId !== 'null') {
        const decodedName = decodeURIComponent(actualChannelId);
        url += `q=${encodeURIComponent(decodedName)}`;
      }
      else {
        throw new Error('No valid channel identifier provided');
      }

      console.log('Fetching channel data from:', url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch channel data: ${response.status}`);
      }
      const data = await response.json();
      console.log('Channel data received:', data);
      return data;
    },
    enabled: !!(actualChannelId || actualChannelName),
    staleTime: 10 * 60 * 1000,
    retry: 2
  });

  // Load more channel videos
  const { data: moreChannelData, isLoading: isLoadingMoreChannelVideos, refetch: loadMoreChannelVideos } = useQuery({
    queryKey: ['channel-more', decodedChannelName, channelId, channelPage],
    queryFn: async () => {
      if (!channelData?.channel?.channelId) return null;

      // For additional pages, we'll search for videos from this specific channel
      const response = await fetch(`/api/search?q=${encodeURIComponent(channelData.channel.name)}&method=scraping&filter=latest&page=${channelPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch more channel videos');
      }
      const result = await response.json();
      // Filter to only videos from this specific channel
      const channelVideos = result.videos.filter((video: any) => 
        video.channelId === channelData.channel.channelId || 
        video.channelTitle === channelData.channel.name
      );
      return { videos: channelVideos };
    },
    enabled: channelPage > 1 && !!channelData?.channel?.channelId,
    staleTime: 10 * 60 * 1000,
  });

  // Initialize channel videos
  useEffect(() => {
    if (channelData?.videos && channelPage === 1) {
      setAllChannelVideos(channelData.videos);
      setHasMoreChannelVideos(channelData.videos.length >= 50);
    }
  }, [channelData, channelPage]);

  // Handle loading more channel videos
  useEffect(() => {
    if (moreChannelData?.videos && channelPage > 1) {
      const newVideos = moreChannelData.videos.filter((newVideo: any) => 
        !allChannelVideos.some((existingVideo: any) => existingVideo.id === newVideo.id)
      );
      setAllChannelVideos(prev => [...prev, ...newVideos]);
      setHasMoreChannelVideos(newVideos.length >= 15);
    }
  }, [moreChannelData, channelPage, allChannelVideos]);

  const handleLoadMoreChannelVideos = () => {
    setChannelPage(prev => prev + 1);
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleVideoClick = (videoId: string) => {
    setLocation(`/watch/${videoId}`);
  };

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">Channel not found</p>
          <p className="text-muted-foreground mb-6">The channel you're looking for doesn't exist or has no videos.</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {isLoading ? (
          <LoadingScreen type="channel" message="Loading channel information..." />
        ) : channelData?.channel ? (
          <>
            {/* Channel Header */}
            <Card className="p-6 mb-8">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-primary flex-shrink-0">
                  {channelData.channel.avatarUrl ? (
                    <img 
                      src={channelData.channel.avatarUrl} 
                      alt={channelData.channel.name || 'Channel'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full text-primary-foreground flex items-center justify-center font-bold text-lg">${(channelData.channel.name || 'U').charAt(0).toUpperCase()}</div>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full text-primary-foreground flex items-center justify-center font-bold text-lg">
                      {(channelData.channel.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{channelData.channel.name || 'Unknown Channel'}</h1>
                  <div className="flex items-center space-x-4 text-muted-foreground mb-2">
                    {channelData.channel.subscriberCount && channelData.channel.subscriberCount !== '' && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{channelData.channel.subscriberCount}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <VideoIcon className="w-4 h-4" />
                      <span>{channelData.channel.videoCount || allChannelVideos.length} videos</span>
                    </div>
                  </div>
                  {channelData.channel.description && channelData.channel.description.trim() !== '' && (
                    <p className="text-muted-foreground text-sm line-clamp-3">{channelData.channel.description}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Sort by:</span>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Duration:</span>
                <Select value={filterDuration} onValueChange={(value: any) => setFilterDuration(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="short">Short (≤4min)</SelectItem>
                    <SelectItem value="medium">Medium (4-20min)</SelectItem>
                    <SelectItem value="long">Long (20min+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Videos Grid */}
            {allChannelVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allChannelVideos.map((video: any) => (
                    <Card 
                      key={video.id}
                      className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/80 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer group"
                      onClick={() => handleVideoClick(video.id)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-secondary">
                        {video.thumbnailUrl ? (
                          <img 
                            src={video.thumbnailUrl} 
                            alt={`${video.title} thumbnail`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            <VideoIcon className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        {video.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                            {video.duration}
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-base mb-3 group-hover:text-primary transition-all duration-300 line-clamp-2 leading-tight">
                          {video.title}
                        </h3>

                        <div className="flex items-center justify-between text-muted-foreground text-sm">
                          <div className="flex items-center space-x-3">
                            {video.viewCount && (
                              <div className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                <span>{video.viewCount}</span>
                              </div>
                            )}
                            {video.publishedAt && (
                              <span>{video.publishedAt}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Load More Videos Button */}
                {hasMoreChannelVideos && (
                  <div className="flex justify-center mt-8">
                    <Button 
                      onClick={handleLoadMoreChannelVideos}
                      disabled={isLoadingMoreChannelVideos}
                      variant="outline"
                      size="lg"
                      className="px-8 py-3"
                    >
                      {isLoadingMoreChannelVideos ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                          Loading More Videos...
                        </>
                      ) : (
                        'Load More Videos'
                      )}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <VideoIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No videos found for this channel</p>
                <p className="text-sm text-muted-foreground mb-4">
                  This channel might not have any videos or they couldn't be loaded.
                </p>
                <Button onClick={() => {
                  setSortBy('latest');
                  setFilterDuration('all');
                }}>
                  Clear Filters
                </Button>
              </Card>
            )}
          </>
        ) : (
          <Card className="text-center py-12">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Channel not found.</p>
            <Button onClick={() => setLocation('/')}>Go Home</Button>
          </Card>
        )}
      </div>
    </main>
  );
}