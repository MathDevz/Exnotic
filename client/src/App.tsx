import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import Header from "@/components/header";
import Home from "@/pages/home";
import SearchResults from "@/pages/search-results";
import VideoPlayer from "@/pages/video-player";
import Channel from "@/pages/channel";
import Settings from "@/pages/settings";
import About from "@/pages/about";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import OpenSource from "@/pages/opensource";
import Recommended from "@/pages/recommended";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { initializeTheme } from "@/lib/theme";
import { UserDataProvider } from "@/contexts/UserDataContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  // Initialize theme on app startup
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserDataProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Header />
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/search/:query?" component={SearchResults} />
            <Route path="/watch/:id" component={VideoPlayer} />
            {/* Updated channel routing to handle both ID and name */}
            <Route path="/channel/:channelId" component={Channel} />
            <Route path="/channel/name/:channelName" component={Channel} />
            <Route path="/settings" component={Settings} />
            <Route path="/about" component={About} />
            <Route path="/terms" component={Terms} />
            <Route path="/privacy" component={Privacy} />
            <Route path="/opensource" component={OpenSource} />
            <Route path="/recommended" component={Recommended} />
            <Route path="/dashboard" component={Dashboard} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </div>
      </UserDataProvider>
    </QueryClientProvider>
  );
}

export default App;