import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  isInWatchLater, 
  isInFavorites, 
  addToWatchLater, 
  removeFromWatchLater, 
  addToFavorites, 
  removeFromFavorites,
  addRelatedVideosToCache,
  type WatchLaterVideo,
  type FavoriteVideo 
} from '@/lib/user-data';

interface UserDataContextType {
  isVideoInWatchLater: (videoId: string) => boolean;
  isVideoInFavorites: (videoId: string) => boolean;
  toggleWatchLater: (video: WatchLaterVideo) => void;
  toggleFavorite: (video: FavoriteVideo) => void;
  refreshData: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [watchLaterSet, setWatchLaterSet] = useState<Set<string>>(new Set());
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());

  // Initialize data from localStorage
  useEffect(() => {
    refreshData();
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'exnotic-watch-later' || e.key === 'exnotic-favorites') {
        refreshData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refreshData = () => {
    // Refresh watch later set
    const watchLaterData = localStorage.getItem('exnotic-watch-later');
    const watchLaterVideos = watchLaterData ? JSON.parse(watchLaterData) : [];
    setWatchLaterSet(new Set(watchLaterVideos.map((v: any) => v.id)));

    // Refresh favorites set
    const favoritesData = localStorage.getItem('exnotic-favorites');
    const favoriteVideos = favoritesData ? JSON.parse(favoritesData) : [];
    setFavoritesSet(new Set(favoriteVideos.map((v: any) => v.id)));
  };

  const isVideoInWatchLater = (videoId: string) => {
    return watchLaterSet.has(videoId);
  };

  const isVideoInFavorites = (videoId: string) => {
    return favoritesSet.has(videoId);
  };

  const toggleWatchLater = (video: WatchLaterVideo) => {
    if (isVideoInWatchLater(video.id)) {
      removeFromWatchLater(video.id);
      setWatchLaterSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });
    } else {
      addToWatchLater(video);
      setWatchLaterSet(prev => new Set(prev).add(video.id));
      // Add related videos and trigger recommendation refresh
      addRelatedVideosToCache(video);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('recommendationsUpdated'));
      }, 100);
    }
  };

  const toggleFavorite = (video: FavoriteVideo) => {
    if (isVideoInFavorites(video.id)) {
      removeFromFavorites(video.id);
      setFavoritesSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.id);
        return newSet;
      });
    } else {
      addToFavorites(video);
      setFavoritesSet(prev => new Set(prev).add(video.id));
      // Add related videos and trigger recommendation refresh
      addRelatedVideosToCache(video);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('recommendationsUpdated'));
      }, 100);
    }
  };

  return (
    <UserDataContext.Provider
      value={{
        isVideoInWatchLater,
        isVideoInFavorites,
        toggleWatchLater,
        toggleFavorite,
        refreshData,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}