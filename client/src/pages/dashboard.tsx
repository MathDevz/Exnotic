import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import VideoCard from "@/components/video-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Heart, Settings, Trash2, Play, BookOpen, Command, TrendingUp } from "lucide-react";
import { 
  getRecentVideos, 
  getWatchLater, 
  getFavorites,
  clearRecentVideos,
  getRecommendedVideos,
  type RecentVideo,
  type WatchLaterVideo,
  type FavoriteVideo
} from "@/lib/user-data";
import { useUserData } from "@/contexts/UserDataContext";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [watchLaterVideos, setWatchLaterVideos] = useState<WatchLaterVideo[]>([]);
  const [favoriteVideos, setFavoriteVideos] = useState<FavoriteVideo[]>([]);
  const { isVideoInWatchLater, isVideoInFavorites, toggleWatchLater, toggleFavorite } = useUserData();

  useEffect(() => {
    loadData();
    
    // Listen for recommendation updates
    const handleRecommendationUpdate = () => {
      setRecommendedVideos(getRecommendedVideos());
    };
    
    window.addEventListener('recommendationsUpdated', handleRecommendationUpdate);
    
    return () => {
      window.removeEventListener('recommendationsUpdated', handleRecommendationUpdate);
    };
  }, []);

  const loadData = () => {
    setRecentVideos(getRecentVideos());
    setRecommendedVideos(getRecommendedVideos());
    setWatchLaterVideos(getWatchLater());
    setFavoriteVideos(getFavorites());
  };

  const handleVideoClick = (videoId: string) => {
    setLocation(`/watch/${videoId}`);
  };

  const handleChannelClick = (channelId: string, channelTitle: string) => {
    if (channelId && channelId !== 'undefined' && channelId !== 'null' && channelId.startsWith('UC')) {
      setLocation(`/channel/${channelId}`);
    } else if (channelTitle && channelTitle !== 'Unknown Channel') {
      setLocation(`/channel/name/${encodeURIComponent(channelTitle)}`);
    }
  };

  const handleClearRecent = () => {
    clearRecentVideos();
    loadData();
  };

  const handleClearWatchLater = () => {
    localStorage.removeItem('exnotic-watch-later');
    loadData();
  };

  const handleClearFavorites = () => {
    localStorage.removeItem('exnotic-favorites');
    loadData();
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
    loadData(); // Refresh data to show updated state
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
    loadData(); // Refresh data to show updated state
  };

  // Helper function to render a video card with separated action buttons
  const renderVideoCard = (video: any, badgeText?: string, badgeColor?: string) => (
    <div 
      key={video.id}
      className="bg-card border border-border rounded-xl overflow-hidden hover:bg-card/80 hover:shadow-lg transition-all duration-200 relative"
    >
      {/* Badge */}
      {badgeText && (
        <div className={`absolute top-2 left-2 ${badgeColor || 'bg-purple-500'} text-white text-xs px-2 py-1 rounded z-20`}>
          {badgeText}
        </div>
      )}

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
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Command className="w-8 h-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">Your personal video hub</p>
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Recommended
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recently Viewed
          </TabsTrigger>
          <TabsTrigger value="watchlater" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Watch Later
          </TabsTrigger>
          <TabsTrigger value="favorites" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Favorites
          </TabsTrigger>
        </TabsList>

        {/* Recommended Videos */}
        <TabsContent value="recommended" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recommended for You
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recommendedVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recommendedVideos.map((video) => 
                    renderVideoCard(
                      {
                        ...video,
                        channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`
                      },
                      'Recommended',
                      'bg-purple-500'
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recommendations yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Start searching and watching videos to get personalized recommendations.
                  </p>
                  <Button onClick={() => setLocation('/')} className="mt-4">
                    Browse Videos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recently Viewed */}
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Recently Viewed
              </CardTitle>
              {recentVideos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearRecent}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear History
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recentVideos.map((video) => 
                    renderVideoCard(
                      {
                        ...video,
                        channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`,
                        viewCount: null,
                        publishedAt: null
                      },
                      new Date(video.watchedAt).toLocaleDateString(),
                      'bg-black/80'
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No recently viewed videos yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Start watching videos and they'll appear here for easy access.
                  </p>
                  <Button onClick={() => setLocation('/')} className="mt-4">
                    Browse Videos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Watch Later */}
        <TabsContent value="watchlater" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Watch Later
              </CardTitle>
              {watchLaterVideos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearWatchLater}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {watchLaterVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {watchLaterVideos.map((video) => 
                    renderVideoCard(
                      {
                        ...video,
                        channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`,
                        viewCount: null,
                        publishedAt: null
                      },
                      'Watch Later',
                      'bg-blue-500'
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No videos saved for later yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Use the "Watch Later" button on videos to save them here.
                  </p>
                  <Button onClick={() => setLocation('/')} className="mt-4">
                    Browse Videos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Favorites */}
        <TabsContent value="favorites" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Favorites
              </CardTitle>
              {favoriteVideos.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFavorites}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {favoriteVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favoriteVideos.map((video) => 
                    renderVideoCard(
                      {
                        ...video,
                        channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`,
                        viewCount: null,
                        publishedAt: null
                      },
                      '❤️ Favorite',
                      'bg-red-500'
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No favorite videos yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Use the heart button on videos to add them to your favorites.
                  </p>
                  <Button onClick={() => setLocation('/')} className="mt-4">
                    Browse Videos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}