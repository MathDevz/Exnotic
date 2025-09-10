
import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingScreenProps {
  type?: 'video-grid' | 'video-player' | 'channel' | 'search' | 'general';
  message?: string;
}

export default function LoadingScreen({ type = 'general', message }: LoadingScreenProps) {
  const renderVideoGridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="p-4 space-y-4 bg-card border border-border">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );

  const renderVideoPlayerSkeleton = () => (
    <div className="space-y-6">
      <Card className="overflow-hidden bg-card border border-border">
        <Skeleton className="aspect-video w-full" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center space-x-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderChannelSkeleton = () => (
    <div className="space-y-6">
      {/* Channel Header Skeleton */}
      <Card className="p-6 bg-card border border-border">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Card>

      {/* Filters Skeleton */}
      <div className="flex space-x-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Videos Grid Skeleton */}
      {renderVideoGridSkeleton()}
    </div>
  );

  const renderSearchSkeleton = () => (
    <div className="space-y-6">
      {/* Search Header Skeleton */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
      </div>

      {/* Search Results Skeleton */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="md:flex">
            <Skeleton className="md:w-80 aspect-video flex-shrink-0" />
            <div className="p-6 flex-1 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGeneralSkeleton = () => (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
      {message && (
        <p className="text-muted-foreground text-center max-w-md">
          {message}
        </p>
      )}
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'video-grid':
        return renderVideoGridSkeleton();
      case 'video-player':
        return renderVideoPlayerSkeleton();
      case 'channel':
        return renderChannelSkeleton();
      case 'search':
        return renderSearchSkeleton();
      default:
        return renderGeneralSkeleton();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {renderSkeleton()}
      </div>
    </div>
  );
}
