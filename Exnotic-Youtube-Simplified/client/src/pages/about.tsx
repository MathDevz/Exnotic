import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Heart, Shield, Zap, Eye, Music } from "lucide-react";

export default function About() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About Exnotic
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A clean, minimal YouTube frontend built for privacy and simplicity
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary" />
            Our Mission
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Exnotic exists to provide a distraction-free YouTube experience. We believe watching videos 
            shouldn't come with ads, tracking, recommendations algorithms, or bloated interfaces. 
            Just you, the content you want, and nothing else.
          </p>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Privacy First</h3>
            </div>
            <p className="text-muted-foreground">
              No tracking, no cookies, no data collection. Your viewing habits stay private.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Lightning Fast</h3>
            </div>
            <p className="text-muted-foreground">
              Minimal interface loads instantly without heavy scripts or unnecessary features.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Ad-Free Experience</h3>
            </div>
            <p className="text-muted-foreground">
              Watch videos without interruptions, pre-rolls, or sponsored content.
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Music className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-semibold">Clean Interface</h3>
            </div>
            <p className="text-muted-foreground">
              Focus on content with a minimal, distraction-free design.
            </p>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">oEmbed Method</Badge>
                Simple & Stable
              </h3>
              <p className="text-muted-foreground">
                Uses YouTube's official oEmbed API for reliable video embedding. Perfect for direct URL playback.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">Scraping Method</Badge>
                Full Search Functionality
              </h3>
              <p className="text-muted-foreground">
                Advanced web scraping for search capabilities and detailed video metadata.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Badge variant="outline">Invidious Integration</Badge>
                🛡️ Admin Block Bypass
              </h3>
              <p className="text-muted-foreground">
                Automatic fallback to Invidious instances to bypass network restrictions and ensure ad-free viewing.
              </p>
            </div>
          </div>
        </Card>

        {/* Technical Stack */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Built With</h2>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Tailwind CSS', 'Express.js', 'Drizzle ORM', 'PostgreSQL', 'Vite'].map((tech) => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </div>
        </Card>

        {/* Call to Action */}
        <Card className="p-8 text-center bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h2 className="text-2xl font-semibold mb-4">Open Source</h2>
          <p className="text-muted-foreground mb-6">
            Exnotic is open source and built with transparency in mind. 
            Check out the code, contribute, or suggest improvements.
          </p>
          <Button size="lg" className="flex items-center gap-2 mx-auto">
            <Github className="w-5 h-5" />
            View on GitHub
          </Button>
        </Card>
      </div>
    </main>
  );
}