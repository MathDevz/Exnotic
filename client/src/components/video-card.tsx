import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, User, Heart, Clock } from "lucide-react";
import { getWatchProgress } from "@/lib/user-data";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useUserData } from "@/contexts/UserDataContext";

interface VideoCardProps {
  video: {
    id: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string | null;
    duration: string | null;
    viewCount: string | null;
    publishedAt: string | null;
    channelAvatarUrl?: string | null;
    channelId?: string; // Added channelId for potential use
  };
  onClick: () => void;
  onChannelClick?: (channelId: string, channelTitle: string) => void; // Updated signature
  progress?: {
    currentTime: number;
    duration: number;
  };
}

export default function VideoCard({ video, onClick, onChannelClick, progress }: VideoCardProps) {
  const [, setLocation] = useLocation();
  const [watchProgress, setWatchProgress] = useState<{ currentTime: number; duration: number } | null>(null);
  const { isVideoInWatchLater, isVideoInFavorites, toggleWatchLater, toggleFavorite } = useUserData();

  useEffect(() => {
    const currentProgress = getWatchProgress(video.id);
    if (currentProgress) {
      setWatchProgress({
        currentTime: currentProgress.currentTime,
        duration: currentProgress.duration
      });
    }
  }, [video.id]);

  const progressData = progress || watchProgress;
  const progressPercentage = progressData ? (progressData.currentTime / progressData.duration) * 100 : 0;

  const handleWatchLater = (e: React.MouseEvent) => {
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

  const handleFavorite = (e: React.MouseEvent) => {
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + "/watch/" + video.id);
  };

  const handleChannelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChannelClick) {
      onChannelClick(video.channelId || video.channelTitle, video.channelTitle);
    } else {
      // Fallback behavior
      if (video.channelId && video.channelId !== 'undefined' && video.channelId !== 'null' && video.channelId.trim() !== '' && video.channelId.startsWith('UC')) {
        setLocation(`/channel/${video.channelId}`);
      } else if (video.channelTitle && video.channelTitle !== 'Unknown Channel') {
        setLocation(`/channel/name/${encodeURIComponent(video.channelTitle)}`);
      }
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card border-border"
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
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

          {/* Progress Bar */}
          {progressData && progressPercentage > 5 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          )}

          {/* Duration Badge */}
          {video.duration && (
            <Badge 
              variant="secondary" 
              className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1"
            >
              {video.duration}
            </Badge>
          )}

          {/* Action Buttons */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/80 hover:bg-black/60 border-0"
              onClick={handleWatchLater}
              title={isVideoInWatchLater(video.id) ? "Remove from Watch Later" : "Add to Watch Later"}
              data-testid={`button-watch-later-${video.id}`}
            >
              <Clock className={`w-3 h-3 ${isVideoInWatchLater(video.id) ? 'text-primary' : 'text-white'}`} />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0 bg-black/80 hover:bg-black/60 border-0"
              onClick={handleFavorite}
              title={isVideoInFavorites(video.id) ? "Remove from Favorites" : "Add to Favorites"}
              data-testid={`button-favorite-${video.id}`}
            >
              <Heart className={`w-3 h-3 ${isVideoInFavorites(video.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
            </Button>
          </div>

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="bg-white/90 rounded-full p-3">
                <Play className="w-6 h-6 text-black fill-current" />
              </div>
            </div>
          </div>
        </div>

        {/* Video Info */}
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-snug text-foreground">
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
              onClick={handleChannelClick}
              title={`Go to ${video.channelTitle}`}
            >
              {video.channelTitle}
            </p>
          </div>

          {/* Progress info for watched videos */}
          {progressData && (
            <div className="mb-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(100, progressPercentage)}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(progressPercentage)}% watched
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}