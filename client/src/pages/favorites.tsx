
import VideoCard from "@/components/video-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { getFavorites } from "@/lib/user-data";
import { useState, useEffect } from "react";

export default function Favorites() {
  const [, setLocation] = useLocation();
  const [favoriteVideos, setFavoriteVideos] = useState<any[]>([]);

  useEffect(() => {
    setFavoriteVideos(getFavorites());
  }, []);

  const clearFavorites = () => {
    localStorage.removeItem('exnotic-favorites');
    setFavoriteVideos([]);
  };

  const handleVideoClick = (videoId: string) => {
    setLocation(`/watch/${videoId}`);
  };

  const handleChannelClick = (channelIdOrTitle: string, channelTitle?: string) => {
    if (channelIdOrTitle.startsWith('UC') && channelTitle) {
      setLocation(`/channel/${channelIdOrTitle}/${encodeURIComponent(channelTitle)}`);
    } else {
      setLocation(`/channel/${encodeURIComponent(channelIdOrTitle)}`);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500" />
            Favorites
          </h1>
          <p className="text-muted-foreground">Your favorite videos</p>
        </div>
        
        {favoriteVideos.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFavorites}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        )}
      </div>

      {favoriteVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteVideos.map((video: any) => (
            <div key={video.id} className="relative">
              <VideoCard 
                video={{
                  ...video,
                  channelAvatarUrl: video.channelAvatarUrl || `https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj`
                }} 
                onClick={() => handleVideoClick(video.id)}
                onChannelClick={(channelId, channelTitle) => handleChannelClick(channelId || video.channelTitle, channelTitle || video.channelTitle)}
              />
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                ❤️ Favorite
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No favorite videos yet.</p>
          <p className="text-sm text-muted-foreground">
            Use the heart button on videos to add them to your favorites.
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
