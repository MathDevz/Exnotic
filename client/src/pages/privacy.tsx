import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Server, Database, Lock, Globe } from "lucide-react";

export default function Privacy() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Shield className="w-10 h-10 text-primary" />
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            Your privacy is our top priority
          </p>
          <Badge variant="outline" className="mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </Badge>
        </div>

        {/* Privacy Principles */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-green-500/5 to-blue-500/5 border border-green-500/20">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Eye className="w-6 h-6 text-green-600" />
            Our Privacy Principles
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-green-600">✅ What We DO</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Provide ad-free video viewing</li>
                <li>• Cache search results temporarily</li>
                <li>• Store recent videos locally in your browser</li>
                <li>• Use secure HTTPS connections</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600">❌ What We DON'T Do</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• Track your viewing habits</li>
                <li>• Store personal information</li>
                <li>• Use analytics or tracking cookies</li>
                <li>• Share data with third parties</li>
                <li>• Build user profiles</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Data Collection */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary" />
            Data Collection & Usage
          </h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="outline">Server Data</Badge>
                Minimal & Temporary
              </h3>
              <p className="text-muted-foreground mb-2">
                We temporarily cache search results to improve performance. This data includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Video titles, descriptions, and thumbnails</li>
                <li>Channel information and view counts</li>
                <li>Search query results (no personal identifiers)</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                This data is automatically deleted after 24 hours and is never linked to individual users.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Badge variant="outline">Local Storage</Badge>
                Your Device Only
              </h3>
              <p className="text-muted-foreground mb-2">
                Some data is stored locally in your browser for convenience:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Recently viewed videos (for the "Recently Viewed" page)</li>
                <li>Theme preferences (dark/light mode)</li>
                <li>Search method preferences</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                This data never leaves your device and can be cleared at any time.
              </p>
            </div>
          </div>
        </Card>

        {/* Technical Safeguards */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary" />
            Technical Safeguards
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">🔒 Security Measures</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• HTTPS encryption for all connections</li>
                <li>• No third-party tracking scripts</li>
                <li>• Secure video streaming through Invidious</li>
                <li>• Regular security updates</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">🛡️ Privacy Features</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• No user accounts or login required</li>
                <li>• No IP address logging</li>
                <li>• Ad-blocking by design</li>
                <li>• Minimal data retention</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Third Party Services */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            Third Party Services
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">YouTube oEmbed API</h3>
              <p className="text-muted-foreground">
                We use YouTube's official oEmbed API to fetch video metadata. This is a public API 
                that doesn't require authentication or personal data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Invidious Instances</h3>
              <p className="text-muted-foreground">
                For ad-free video streaming and bypassing network restrictions, we connect to 
                public Invidious instances. These are privacy-focused YouTube frontends that don't track users.
              </p>
            </div>
          </div>
        </Card>

        {/* Your Rights */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Your Rights & Controls</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">🗑️ Clear Your Data</h3>
              <p className="text-muted-foreground">
                You can clear all locally stored data (recently viewed videos, preferences) 
                by clearing your browser's local storage or using the "Clear History" button.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🚫 Opt-Out</h3>
              <p className="text-muted-foreground">
                Since we don't track users, there's nothing to opt out of. Simply stop using 
                the service if you no longer want to access it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">❓ Questions</h3>
              <p className="text-muted-foreground">
                If you have any questions about our privacy practices, you can reach out through 
                our GitHub repository or contact form.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-8 text-center bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h2 className="text-2xl font-semibold mb-4">Questions About Privacy?</h2>
          <p className="text-muted-foreground mb-6">
            We're committed to transparency. If you have any questions about how we handle privacy, 
            please don't hesitate to reach out.
          </p>
          <div className="flex justify-center gap-4">
            <Badge variant="secondary">Open Source</Badge>
            <Badge variant="secondary">No Tracking</Badge>
            <Badge variant="secondary">Privacy First</Badge>
          </div>
        </Card>
      </div>
    </main>
  );
}