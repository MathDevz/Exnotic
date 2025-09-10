import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/video-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingScreen from "@/components/loading-screen";
import { TrendingUp, Clock, Award, Heart, Play } from "lucide-react";
import { useLocation } from "wouter";
import { cacheVideosForRecommendations } from "@/lib/user-data";
import { useUserData } from "@/contexts/UserDataContext";

type TrendingCategory = 'music' | 'gaming' | 'news' | 'sports';

interface TrendingVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  category: TrendingCategory;
}

export default function Recommended() {
  const [activeCategory, setActiveCategory] = useState<'all' | TrendingCategory>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [_, navigate] = useLocation();
  const { isVideoInWatchLater, isVideoInFavorites, toggleWatchLater, toggleFavorite } = useUserData();

  const { data: trendingVideos, isLoading, refetch } = useQuery({
    queryKey: ['/api/trending', activeCategory, currentPage],
    queryFn: async () => {
      // Fetch trending videos based on popular search terms
      const trendingQueries = {
        all: ['music', 'gaming', 'news', 'tutorial', 'review'],
        music: ['music', 'song', 'artist', 'album'],
        gaming: ['gaming', 'gameplay', 'review', 'trailer'],
        news: ['news', 'breaking', 'update', 'politics'],
        sports: ['sports', 'football', 'basketball', 'soccer']
      };

      const queries = trendingQueries[activeCategory];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];

      const response = await fetch(`/api/search?q=${encodeURIComponent(randomQuery)}&method=scraping&page=${currentPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trending videos');
      }

      const data = await response.json();
      // Filter out channels, only keep videos
      const videosOnly = data.videos.filter((item: any) => !item.type || item.type !== 'channel');

      if (currentPage === 1) {
        const videos = videosOnly.slice(0, 20);
        setAllVideos(videos);
        // Cache videos for recommendations
        cacheVideosForRecommendations(videos);
        return videos;
      } else {
        const newVideos = videosOnly.slice(0, 20);
        // Prevent duplicates by checking existing video IDs
        setAllVideos(prev => {
          const existingIds = new Set(prev.map(video => video.id));
          const uniqueNewVideos = newVideos.filter((video: any) => !existingIds.has(video.id));
          return [...prev, ...uniqueNewVideos];
        });
        // Return updated list for query data
        const existingIds = new Set(allVideos.map(video => video.id));
        const uniqueNewVideos = newVideos.filter((video: any) => !existingIds.has(video.id));
        return [...allVideos, ...uniqueNewVideos];
      }
    },
  });

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleCategoryChange = (category: 'all' | TrendingCategory) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setAllVideos([]);
  };

  const displayVideos = allVideos.length > 0 ? allVideos : (trendingVideos || []);

  const categories = [
    { id: 'all' as const, label: 'All', icon: TrendingUp },
    { id: 'music' as const, label: 'Music', icon: Clock },
    { id: 'gaming' as const, label: 'Gaming', icon: Award },
    { id: 'news' as const, label: 'News', icon: Clock }
  ];

  const handleVideoClick = (videoId: string) => {
    navigate(`/watch/${videoId}`);
  };

  const handleChannelClick = (channelIdOrTitle: string, channelTitle?: string) => {
    if (channelIdOrTitle.startsWith('UC') && channelTitle) {
      navigate(`/channel/${channelIdOrTitle}`);
    } else {
      navigate(`/channel/name/${encodeURIComponent(channelIdOrTitle)}`);
    }
  };

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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-primary" />
          Trending Now
        </h1>
        <p className="text-muted-foreground">Popular videos from across YouTube</p>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeCategory === id ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleCategoryChange(id)}
            className="flex items-center gap-2"
            data-testid={`button-category-${id}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Videos Grid */}
      {isLoading && currentPage === 1 ? (
        <LoadingScreen />
      ) : displayVideos && displayVideos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayVideos.map((video: any) => (
              <div 
                key={video.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/80 hover:shadow-lg transition-all duration-200"
              >
                {/* Thumbnail - Action buttons positioned here, separate from main click area */}
                <div className="relative aspect-video bg-muted group">
                  <div 
                    className="w-full h-full cursor-pointer"
                    onClick={() => handleVideoClick(video.id)}
                  >
                    {video.thumbnailUrl ? (
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Play className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}

                    {/* Duration Badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </div>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/90 rounded-full p-3">
                          <Play className="w-6 h-6 text-black fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Positioned outside main click area */}
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

                {/* Video Info - Also clickable to open video */}
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-snug text-foreground hover:text-primary transition-colors">
                    {video.title}
                  </h3>

                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      {video.channelAvatarUrl && video.channelAvatarUrl !== 'https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj' ? (
                        <img 
                          src={video.channelAvatarUrl} 
                          alt={video.channelTitle}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<span class="text-primary-foreground font-semibold text-xs">${video.channelTitle.charAt(0).toUpperCase()}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-primary-foreground font-semibold text-xs">
                          {video.channelTitle.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p 
                      className="text-muted-foreground text-sm hover:text-purple-600 transition-colors cursor-pointer truncate"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChannelClick(video.channelId || video.channelTitle, video.channelTitle);
                      }}
                      title={`Go to ${video.channelTitle}`}
                    >
                      {video.channelTitle}
                    </p>
                  </div>

                  <div className="flex items-center text-muted-foreground text-xs space-x-2">
                    {video.viewCount && <span>{video.viewCount}</span>}
                    {video.viewCount && video.publishedAt && <span>•</span>}
                    {video.publishedAt && <span>{video.publishedAt}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View More Button */}
          <div className="flex justify-center mt-8">
            <Button 
              onClick={handleLoadMore}
              disabled={isLoading && currentPage > 1}
              variant="outline"
              size="lg"
              className="px-8 py-3"
            >
              {isLoading && currentPage > 1 ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading More Videos...
                </>
              ) : (
                'View More Videos'
              )}
            </Button>
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
          <p className="text-muted-foreground mb-4">No trending videos found at the moment.</p>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </Card>
      )}
    </main>
  );
}