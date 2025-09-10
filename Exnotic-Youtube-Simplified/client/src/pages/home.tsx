import { useState } from "react";
import { useLocation, Link } from "wouter";
import SearchBar from "@/components/search-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logoUrl from "@assets/Untitled_design-removebg-preview_1757465095782.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const [method, setMethod] = useState<'oembed' | 'scraping'>('scraping');

  const handleSearch = (query: string) => {
    if (query.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(query.trim())}&method=${method}&filter=relevant`;
      window.location.href = searchUrl;
    }
  };

  return (
    <main className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent bounce-in">
          YouTube, Simplified
        </h2>
        <p className="text-xl text-muted-foreground mb-8 leading-relaxed fade-in">
          Watch YouTube videos without ads, recommendations, or distractions. 
          Just pure, clean video content in a minimal interface.
        </p>
        
        <SearchBar onSearch={handleSearch} placeholder="Search videos or paste YouTube link..." />
        
        {/* Method Selection - moved under search bar */}
        <div className="flex justify-center mt-4 mb-2">
          <div className="flex items-center space-x-4 bg-card border border-border rounded-lg p-2">
            <span className="text-sm text-muted-foreground font-medium">Method:</span>
            <Button
              variant={method === 'scraping' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMethod('scraping')}
              className="text-xs"
              data-testid="button-method-scraping"
            >
              Scraping
              <Badge variant="secondary" className="ml-1 text-xs">Search + URLs</Badge>
            </Button>
            <Button
              variant={method === 'oembed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMethod('oembed')}
              className="text-xs"
              data-testid="button-method-oembed"
            >
              oEmbed
              <Badge variant="secondary" className="ml-1 text-xs">URLs Only</Badge>
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-3">
          {method === 'oembed' 
            ? "oEmbed method: Paste any YouTube video URL for stable, simple playback"
            : "Scraping method: Search for videos or paste URLs - more features but may break if YouTube changes"
          }
        </p>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto slide-up">
        <Card className="text-center p-6 bg-card border border-border">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No Ads</h3>
          <p className="text-muted-foreground text-sm">Clean video experience without any advertisements or interruptions</p>
        </Card>
        
        <Card className="text-center p-6 bg-card border border-border">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">No Tracking</h3>
          <p className="text-muted-foreground text-sm">Your privacy protected with no data collection or tracking algorithms</p>
        </Card>
        
        <Card className="text-center p-6 bg-card border border-border">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Lightning Fast</h3>
          <p className="text-muted-foreground text-sm">Minimal interface loads instantly without heavy scripts or bloat</p>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 mt-16 -mx-4 px-4">
        <div className="container mx-auto py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={logoUrl} 
                  alt="Exnotic" 
                  className="w-8 h-8"
                />
                <span className="text-primary font-semibold">Exnotic</span>
              </div>
              <span className="text-muted-foreground text-sm">Clean YouTube Experience</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="/opensource" className="hover:text-foreground transition-colors">Open Source</Link>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-muted-foreground text-sm">
            <p>© 2025 Exnotic. Built with privacy in mind. Not affiliated with YouTube or Google.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
