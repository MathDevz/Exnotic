import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Clock, X } from "lucide-react";
import { getSearchSuggestions, getRecentSearches, addSearchSuggestion, clearSearchHistory } from "@/lib/user-data";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  compact?: boolean;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "Search videos or paste YouTube link...", 
  initialValue = "",
  compact = false
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (query.trim()) {
      setSuggestions(getSearchSuggestions(query));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('SearchBar handleSubmit called with query:', query);
    if (query.trim()) {
      console.log('Calling onSearch with:', query.trim());
      addSearchSuggestion(query.trim());
      onSearch(query.trim());
      setShowSuggestions(false);
    } else {
      console.log('SearchBar: Empty query, not calling onSearch');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    const allOptions = query.trim() ? suggestions : recentSearches;
    
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && allOptions[selectedIndex]) {
        setQuery(allOptions[selectedIndex]);
        addSearchSuggestion(allOptions[selectedIndex]);
        onSearch(allOptions[selectedIndex]);
        setShowSuggestions(false);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => prev < allOptions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    addSearchSuggestion(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setRecentSearches([]);
  };

  if (compact) {
    return (
      <div ref={containerRef} className="relative w-full">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            className="pr-10 bg-card border-border focus:ring-ring w-full h-10"
            data-testid="input-search-compact"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            data-testid="button-search-compact"
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
        
        {showSuggestions && (query.trim() || recentSearches.length > 0) && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
            {query.trim() ? (
              suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-muted-foreground mb-2">Suggestions</div>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      className={`px-3 py-2 text-sm cursor-pointer rounded ${
                        selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <Search className="w-3 h-3 inline mr-2" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )
            ) : (
              recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-muted-foreground">Recent searches</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearHistory}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={search}
                      className={`px-3 py-2 text-sm cursor-pointer rounded ${
                        selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                      onClick={() => handleSuggestionClick(search)}
                    >
                      <Clock className="w-3 h-3 inline mr-2" />
                      {search}
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative max-w-2xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative group">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          className="w-full px-6 py-4 text-lg bg-card border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground pr-32"
          data-testid="input-search"
        />
        <Button
          type="submit"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-primary-foreground px-8 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 font-semibold border border-primary/20"
          data-testid="button-search"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </form>
      
      {showSuggestions && (query.trim() || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-80 overflow-y-auto">
          {query.trim() ? (
            suggestions.length > 0 && (
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-3">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={`px-4 py-3 text-base cursor-pointer rounded-lg ${
                      selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <Search className="w-4 h-4 inline mr-3" />
                    {suggestion}
                  </div>
                ))}
              </div>
            )
          ) : (
            recentSearches.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">Recent searches</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearHistory}
                    className="h-8 px-3 text-sm"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={search}
                    className={`px-4 py-3 text-base cursor-pointer rounded-lg ${
                      selectedIndex === index ? 'bg-accent' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSuggestionClick(search)}
                  >
                    <Clock className="w-4 h-4 inline mr-3" />
                    {search}
                  </div>
                ))}
              </div>
            )
          )}
        </Card>
      )}
    </div>
  );
}
