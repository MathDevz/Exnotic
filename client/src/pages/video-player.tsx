import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import LoadingScreen from "@/components/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Settings, Share2, Download, ThumbsUp, Eye, Calendar, User, Play, ExternalLink, Heart, Clock, Plus } from "lucide-react";
import VideoCard from "@/components/video-card";
import { saveWatchProgress, getWatchProgress, addToWatchLater, removeFromWatchLater, isInWatchLater, addToFavorites, removeFromFavorites, isInFavorites } from "@/lib/user-data";
import type { Video } from "@shared/schema";

export default function VideoPlayer() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user settings
  const [userSettings, setUserSettings] = useState({
    videoQuality: 'auto',
    autoBypass: true,
    autoplay: false,
    darkMode: true
  });

  // New feature states
  const [isInWL, setIsInWL] = useState(false);
  const [isInFav, setIsInFav] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('exnotic-settings');
    if (savedSettings) {
      try {
        setUserSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.log('Failed to load settings');
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'arrowleft':
          e.preventDefault();
          setCurrentTime(prev => Math.max(0, prev - 10));
          break;
        case 'arrowright':
          e.preventDefault();
          setCurrentTime(prev => prev + 10);
          break;
        case 'f':
          e.preventDefault();
          if (videoContainerRef.current) {
            if (!document.fullscreenElement) {
              videoContainerRef.current.requestFullscreen();
              setIsFullscreen(true);
            } else {
              document.exitFullscreen();
              setIsFullscreen(false);
            }
          }
          break;
        case 'm':
          e.preventDefault();
          setIsMuted(prev => !prev);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const { data: video, isLoading, error } = useQuery({
    queryKey: ['/api/video', id, userSettings.autoBypass],
    queryFn: async () => {
      if (userSettings.autoBypass) {
        try {
          const invidiousResponse = await fetch(`/api/invidious/${id}`);
          if (invidiousResponse.ok) {
            const invidiousData = await invidiousResponse.json();
            if (invidiousData.invidiousInstance) {
              return { ...invidiousData, useInvidious: true };
            }
          }
        } catch (e) {
          console.log('Invidious failed, trying proxy method');
        }

        try {
          const proxyResponse = await fetch(`/api/proxy/${id}`);
          if (proxyResponse.ok) {
            const proxyData = await proxyResponse.json();
            return { ...proxyData, useProxy: true };
          }
        } catch (e) {
          console.log('Proxy method failed, using regular embed');
        }
      }

      const response = await fetch(`/api/video/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      const data = await response.json();
      return { ...data, useInvidious: false, useProxy: false };
    },
    enabled: !!id,
  });

  // Update states when video changes
  useEffect(() => {
    if (video && id) {
      setIsInWL(isInWatchLater(id));
      setIsInFav(isInFavorites(id));

      // Start progress tracking
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);

      return () => {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }
  }, [video, id]);

  // Save progress periodically
  useEffect(() => {
    if (video && id && currentTime > 0) {
      if (currentTime % 10 === 0) {
        const duration = video.duration ? parseDuration(video.duration) : 0;
        if (duration > 0) {
          saveWatchProgress(id, currentTime, duration);
        }
      }
    }
  }, [currentTime, video, id]);

  // Add to recently viewed when video loads
  useEffect(() => {
    if (video && id) {
      const recentVideo = {
        id: video.id,
        title: video.title,
        description: video.description || null,
        channelTitle: video.channelTitle,
        channelId: video.channelId || '',
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt || null,
        watchedAt: new Date().toISOString()
      };

      const existingRecent = localStorage.getItem('exnotic-recent-videos');
      let recentVideos = existingRecent ? JSON.parse(existingRecent) : [];

      recentVideos = recentVideos.filter((v: any) => v.id !== video.id);
      recentVideos.unshift(recentVideo);
      recentVideos = recentVideos.slice(0, 50);

      localStorage.setItem('exnotic-recent-videos', JSON.stringify(recentVideos));
    }
  }, [video, id]);

  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const handleBack = () => {
    const referrer = document.referrer;
    const currentOrigin = window.location.origin;

    if (referrer && referrer.startsWith(currentOrigin) && referrer.includes('/search')) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  const handleWatchLater = () => {
    if (!video) return;

    if (isInWL) {
      removeFromWatchLater(video.id);
      setIsInWL(false);
    } else {
      addToWatchLater({
        id: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        addedAt: new Date().toISOString()
      });
      setIsInWL(true);
    }
  };

  const handleFavorite = () => {
    if (!video) return;

    if (isInFav) {
      removeFromFavorites(video.id);
      setIsInFav(false);
    } else {
      addToFavorites({
        id: video.id,
        title: video.title,
        channelTitle: video.channelTitle,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        addedAt: new Date().toISOString()
      });
      setIsInFav(true);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Video link has been copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };


  const handleChannelClick = (channelTitle: string, channelId?: string) => {
    if (channelId && channelId !== 'undefined' && channelId !== 'null' && channelId.trim() !== '' && channelId.startsWith('UC')) {
      setLocation(`/channel/${channelId}`);
    } else if (channelTitle && channelTitle !== 'Unknown Channel') {
      setLocation(`/channel/name/${encodeURIComponent(channelTitle)}`);
    }
  };

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-destructive text-lg mb-4">Video not found</p>
          <p className="text-muted-foreground mb-6">The video you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {video ? (
          <>
            <Card className="bg-card border border-border rounded-xl overflow-hidden mb-8">
              <div ref={videoContainerRef} className="relative aspect-video bg-black" data-testid="video-player">
                {video.useInvidious && video.invidiousInstance ? (
                  <iframe 
                    ref={iframeRef}
                    src={`${video.invidiousInstance}/embed/${video.id}?autoplay=${userSettings.autoplay ? 1 : 0}&quality=${userSettings.videoQuality === 'low' ? 'small' : userSettings.videoQuality === 'medium' ? 'medium' : userSettings.videoQuality === 'high' ? 'hd720' : 'dash'}&local=true&dark_mode=${userSettings.darkMode}&player_style=youtube`}
                    className="w-full h-full"
                    frameBorder="0" 
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    title={video.title}
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                  />
                ) : video.useProxy && video.proxyMethods ? (
                  <iframe 
                    ref={iframeRef}
                    src={`${video.proxyMethods[0]}?autoplay=${userSettings.autoplay ? 1 : 0}&mute=0&rel=0&modestbranding=1`}
                    className="w-full h-full"
                    frameBorder="0" 
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    title={video.title}
                    onError={() => {
                      console.log('Primary proxy failed, trying fallback');
                    }}
                  />
                ) : (
                  <iframe 
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=${userSettings.autoplay ? 1 : 0}&mute=${userSettings.autoplay ? 1 : 0}&rel=0&modestbranding=1&fs=1&playsinline=1&vq=${userSettings.videoQuality === 'low' ? 'small' : userSettings.videoQuality === 'medium' ? 'medium' : userSettings.videoQuality === 'high' ? 'hd720' : 'auto'}&quality=${userSettings.videoQuality === 'low' ? 'small' : userSettings.videoQuality === 'medium' ? 'medium' : userSettings.videoQuality === 'high' ? 'hd720' : 'auto'}`} 
                    className="w-full h-full"
                    frameBorder="0" 
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    title={video.title}
                  />
                )}

                <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {video.useInvidious ? '🛡️ Ad-Free' : video.useProxy ? '🔓 Proxy' : 'YouTube'}
                </div>

                <div className="absolute bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded opacity-0 hover:opacity-100 transition-opacity">
                  <div>Space: Play/Pause</div>
                  <div>← →: Seek 10s</div>
                  <div>F: Fullscreen</div>
                  <div>M: Mute</div>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold mb-4" data-testid="text-video-title">
                  {video.title}
                </h1>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div 
                    className="flex items-center space-x-4 cursor-pointer hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors"
                    onClick={() => handleChannelClick(video.channelTitle, video.channelId)}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-primary">
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
                              parent.innerHTML = `<span class="text-primary-foreground font-semibold">${video.channelTitle.charAt(0).toUpperCase()}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <span className="text-primary-foreground font-semibold">
                          {video.channelTitle.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-purple-600 transition-colors" data-testid="text-channel-name">
                        {video.channelTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground">View channel</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-muted-foreground text-sm">
                    {video.viewCount && (
                      <span data-testid="text-view-count">{video.viewCount}</span>
                    )}
                    {video.viewCount && video.publishedAt && <span>•</span>}
                    {video.publishedAt && (
                      <span data-testid="text-published-date">{video.publishedAt}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleWatchLater}
                    className={isInWL ? "bg-primary/10 border-primary" : ""}
                  >
                    <Clock className={`w-4 h-4 mr-2 ${isInWL ? 'text-primary' : ''}`} />
                    {isInWL ? 'Remove from Watch Later' : 'Watch Later'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFavorite}
                    className={isInFav ? "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" : ""}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isInFav ? 'text-red-500 fill-current' : ''}`} />
                    {isInFav ? 'Remove from Favorites' : 'Add to Favorites'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>

                </div>


                <div className="border-t border-border pt-6 mb-6">
                  <h3 className="font-semibold mb-3">Keyboard Controls</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div><kbd className="bg-muted px-2 py-1 rounded">Space</kbd> Play/Pause</div>
                    <div><kbd className="bg-muted px-2 py-1 rounded">F</kbd> Fullscreen</div>
                    <div><kbd className="bg-muted px-2 py-1 rounded">M</kbd> Mute/Unmute</div>
                    <div><kbd className="bg-muted px-2 py-1 rounded">←/→</kbd> Seek ±10s</div>
                  </div>
                </div>

                {video.description && (
                  <div className="border-t border-border pt-6">
                    <h3 className="font-semibold mb-3">Description</h3>
                    <div className="text-muted-foreground whitespace-pre-wrap" data-testid="text-video-description">
                      {video.description}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  );
}