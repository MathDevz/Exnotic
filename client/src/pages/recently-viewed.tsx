import { useQuery } from "@tanstack/react-query";
import VideoCard from "@/components/video-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, Play } from "lucide-react";
import { useLocation } from "wouter";
import { getAllWatchProgress } from "@/lib/user-data";

interface RecentVideo {
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

export default function RecentlyViewed() {
  const [, setLocation] = useLocation();

  // Get recently viewed videos from localStorage
  const getRecentVideos = (): RecentVideo[] => {
    try {
      const recent = localStorage.getItem('exnotic-recent-videos');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  };

  // Get videos with watch progress for continue watching
  const getContinueWatchingVideos = () => {
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
      .filter((video): video is RecentVideo & { progress: any } => video !== null)
      .slice(0, 8); // Show max 8 videos
  };

  const clearRecentVideos = () => {
    localStorage.removeItem('exnotic-recent-videos');
    window.location.reload(); // Simple refresh to update the list
  };

  const handleVideoClick = (videoId: string) => {
    setLocation(`/watch/${videoId}`);
  };

  const handleChannelClick = (channelId: string, channelTitle: string) => {
    if (channelId && channelId !== 'undefined' && channelId !== 'null') {
      setLocation(`/channel/${channelId}`);
    } else {
      setLocation(`/channel/name/${encodeURIComponent(channelTitle)}`);
    }
  };

  const recentVideos = getRecentVideos();
  const continueWatchingVideos = getContinueWatchingVideos();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Clock className="w-8 h-8 text-primary" />
            Recently Viewed
          </h1>
          <p className="text-muted-foreground">Videos you've watched recently</p>
        </div>

        {recentVideos.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearRecentVideos}
            className="flex items-center gap-2"
            data-testid="button-clear-history"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </Button>
        )}
      </div>

      {/* Continue Watching Section */}
      {continueWatchingVideos.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Play className="w-6 h-6 text-primary" />
            Continue Watching
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {continueWatchingVideos.map((video) => (
              <div key={`continue-${video.id}`} className="relative">
                <VideoCard
                  video={{
                    ...video,
                    channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`
                  }}
                  onClick={() => handleVideoClick(video.id)}
                  onChannelClick={(channelId, channelTitle) => handleChannelClick(channelId || video.channelTitle, channelTitle || video.channelTitle)}
                />
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  {Math.round((video.progress.currentTime / video.progress.duration) * 100)}% watched
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(video.progress.currentTime / video.progress.duration) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recentVideos.map((video: RecentVideo) => (
            <div key={`${video.id}-${video.watchedAt}`} className="relative">
              <VideoCard
                video={{
                  ...video,
                  channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj` // Default YouTube avatar
                }}
                onClick={() => handleVideoClick(video.id)}
                onChannelClick={(channelId, channelTitle) => handleChannelClick(channelId || video.channelTitle, channelTitle || video.channelTitle)}
              />
              <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                Watched: {new Date(video.watchedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No recently viewed videos yet.</p>
          <p className="text-sm text-muted-foreground">
            Start watching videos and they'll appear here for easy access.
          </p>
          <Button
            onClick={() => window.location.href = '/'}
            className="mt-4"
          >
            Browse Videos
          </Button>
        </Card>
      )}
    </main>
  );
}