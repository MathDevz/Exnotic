
import VideoCard from "@/components/video-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { getWatchLater } from "@/lib/user-data";
import { useState, useEffect } from "react";

export default function WatchLater() {
  const [, setLocation] = useLocation();
  const [watchLaterVideos, setWatchLaterVideos] = useState<any[]>([]);

  useEffect(() => {
    setWatchLaterVideos(getWatchLater());
  }, []);

  const clearWatchLater = () => {
    localStorage.removeItem('exnotic-watch-later');
    setWatchLaterVideos([]);
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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Clock className="w-8 h-8 text-primary" />
            Watch Later
          </h1>
          <p className="text-muted-foreground">Videos saved for later viewing</p>
        </div>
        
        {watchLaterVideos.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearWatchLater}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {watchLaterVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {watchLaterVideos.map((video: any) => (
            <div key={video.id} className="relative">
              <VideoCard 
                video={{
                  ...video,
                  channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`
                }} 
                onClick={() => handleVideoClick(video.id)}
                onChannelClick={(channelId, channelTitle) => handleChannelClick(channelId || video.channelTitle, channelTitle || video.channelTitle)}
              />
              <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                Added: {new Date(video.addedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No videos saved for later yet.</p>
          <p className="text-sm text-muted-foreground">
            Use the "Watch Later" button on videos to save them here.
          </p>
          <Button 
            onClick={() => setLocation('/')}
            className="mt-4"
          >
            Browse Videos
          </Button>
        </Card>
      )}
    </main>
  );
}
