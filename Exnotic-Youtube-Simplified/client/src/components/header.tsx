import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Home, TrendingUp, Info, Search, X, Command } from "lucide-react";
import SearchBar from "./search-bar";
import logoUrl from "@assets/Untitled_design-removebg-preview_1757465095782.png";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const toggleMobileSearch = () => {
    setShowMobileSearch(!showMobileSearch);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Use scraping method by default for header searches
      const searchUrl = `/search?q=${encodeURIComponent(query.trim())}&method=scraping&filter=relevant`;
      window.location.href = searchUrl;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLocation('/')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src={logoUrl} 
                alt="Exnotic Logo" 
                className="w-12 h-12 object-contain"
              />
              <span 
                className="text-3xl font-bold"
                style={{ color: 'hsl(262, 83%, 58%)' }}
              >
                Exnotic
              </span>
            </button>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center justify-center">
            <div className="w-full max-w-lg">
              <SearchBar onSearch={handleSearch} compact />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMobileSearch}
            >
              {showMobileSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </Button>

            <Button
              variant={location === '/' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocation('/')}
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>

            <Button
              variant={location === '/recommended' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocation('/recommended')}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trending</span>
            </Button>

            <Button
              variant={location === '/dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center space-x-2"
            >
              <Command className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            <Button
              variant={location === '/about' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocation('/about')}
              className="flex items-center space-x-2"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">About</span>
            </Button>

            <Button
              variant={location === '/settings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLocation('/settings')}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </nav>
        </div>

        {/* Mobile Search */}
        {showMobileSearch && (
          <div className="md:hidden pb-4 border-t border-border mt-4 pt-4">
            <SearchBar onSearch={handleSearch} />
          </div>
        )}
      </div>
    </header>
  );
}