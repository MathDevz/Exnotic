import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Github, Code, Heart, Users } from "lucide-react";

export default function OpenSource() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Open Source</h1>
        
        <div className="space-y-8">
          <Card className="p-8 bg-card border border-border text-center">
            <Github className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-2xl font-semibold mb-4">Built in the Open</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Exnotic is proudly open source, built with transparency and community collaboration. 
              Our code is available for everyone to inspect, contribute to, and learn from.
            </p>
            <Button 
              onClick={() => window.open('https://github.com/your-username/exnotic', '_blank')}
              className="bg-primary hover:bg-primary/90"
            >
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 bg-card border border-border">
              <Code className="w-10 h-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">Technology Stack</h3>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li>• React + TypeScript frontend</li>
                <li>• Express.js backend</li>
                <li>• Shadcn/ui components</li>
                <li>• Tailwind CSS styling</li>
                <li>• Vite build system</li>
              </ul>
            </Card>

            <Card className="p-6 bg-card border border-border">
              <Heart className="w-10 h-10 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-3">Contributing</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We welcome contributions! Whether it's bug fixes, new features, 
                documentation improvements, or design enhancements - every 
                contribution helps make Exnotic better.
              </p>
            </Card>
          </div>

          <Card className="p-8 bg-card border border-border">
            <Users className="w-12 h-12 mb-4 text-primary mx-auto" />
            <h2 className="text-2xl font-semibold mb-4 text-center">Community</h2>
            <p className="text-muted-foreground leading-relaxed text-center">
              Join our community of privacy-focused developers and users. Share ideas, 
              report issues, suggest improvements, and help shape the future of 
              distraction-free video viewing.
            </p>
          </Card>

          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">License</h3>
            <p className="text-muted-foreground">
              Released under the MIT License - free to use, modify, and distribute.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}