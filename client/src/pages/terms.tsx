import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
        
        <Card className="p-8 bg-card border border-border">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Service Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                Exnotic provides a clean, ad-free interface for viewing YouTube content. Our service 
                acts as a proxy to present YouTube videos in a minimal, distraction-free environment.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Acceptable Use</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Use the service for personal, non-commercial purposes</li>
                <li>Respect content creators' rights and YouTube's terms</li>
                <li>Do not attempt to circumvent any technical limitations</li>
                <li>Do not use automated tools to scrape or abuse the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Disclaimer</h2>
              <p className="text-muted-foreground leading-relaxed">
                Exnotic is not affiliated with YouTube or Google. We provide this service as-is, 
                without warranties. The availability of content depends on YouTube's policies and 
                technical changes may affect functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Content Responsibility</h2>
              <p className="text-muted-foreground leading-relaxed">
                All video content remains the property of its original creators and YouTube. 
                We do not host, modify, or claim ownership of any video content displayed 
                through our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Service Changes</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify or discontinue the service at any time. 
                As an open-source project, the community may contribute to its evolution.
              </p>
            </section>
          </div>
        </Card>
      </div>
    </main>
  );
}