import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Video, Shield, Palette, Trash2, Download, Upload } from "lucide-react";
import { applyTheme } from "@/lib/theme";

interface AppSettings {
  videoQuality: 'auto' | 'high' | 'medium' | 'low';
  autoBypass: boolean;
  darkMode: boolean;
  autoplay: boolean;
  saveHistory: boolean;
  preferredProxy: 'invidious' | 'noembed' | 'direct';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    videoQuality: 'auto',
    autoBypass: true,
    darkMode: true,
    autoplay: false,
    saveHistory: true,
    preferredProxy: 'invidious'
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('exnotic-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        // Apply theme based on saved settings
        applyTheme(parsed.darkMode);
      } else {
        // Create default settings if none exist
        const defaultSettings: AppSettings = {
          videoQuality: 'auto',
          autoBypass: true,
          darkMode: true,
          autoplay: false,
          saveHistory: true,
          preferredProxy: 'invidious'
        };
        localStorage.setItem('exnotic-settings', JSON.stringify(defaultSettings));
        setSettings(defaultSettings);
        // Apply default theme
        applyTheme(defaultSettings.darkMode);
      }
    } catch (e) {
      console.log('Failed to load settings, using defaults');
      // Apply default theme in case of error
      applyTheme(true); // Assuming default is dark mode
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: AppSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem('exnotic-settings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings');
    }
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);

    // Apply theme immediately if darkMode changes
    if (key === 'darkMode') {
      applyTheme(value as boolean);
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem('exnotic-recent-videos');
      alert('History cleared successfully');
    } catch (e) {
      console.error('Failed to clear history');
      alert('Failed to clear history');
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      try {
        localStorage.clear();
        alert('All data cleared successfully. The page will now reload.');
        window.location.reload();
      } catch (e) {
        console.error('Failed to clear data');
        alert('Failed to clear all data');
      }
    }
  };

  const exportAllData = () => {
    try {
      // Gather all data from localStorage
      const allData = {
        settings: settings,
        favorites: JSON.parse(localStorage.getItem('exnotic-favorites') || '[]'),
        watchLater: JSON.parse(localStorage.getItem('exnotic-watch-later') || '[]'),
        recentVideos: JSON.parse(localStorage.getItem('exnotic-recent-videos') || '[]'),
        searchHistory: JSON.parse(localStorage.getItem('exnotic-search-history') || '[]'),
        recommendationCache: JSON.parse(localStorage.getItem('exnotic-recommendation-cache') || '[]'),
        continueWatching: JSON.parse(localStorage.getItem('exnotic-continue-watching') || '[]'),
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };

      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exnotic-data-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert('Data exported successfully! Keep this file safe to restore your data later.');
    } catch (e) {
      console.error('Failed to export data');
      alert('Failed to export data');
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Please select a valid JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate the data structure
        if (!importedData.settings || !importedData.exportDate) {
          alert('Invalid backup file format');
          return;
        }

        if (confirm('This will replace all your current data with the imported data. Are you sure you want to continue?')) {
          // Import all data
          if (importedData.settings) {
            localStorage.setItem('exnotic-settings', JSON.stringify(importedData.settings));
            setSettings(importedData.settings);
            applyTheme(importedData.settings.darkMode);
          }
          if (importedData.favorites) {
            localStorage.setItem('exnotic-favorites', JSON.stringify(importedData.favorites));
          }
          if (importedData.watchLater) {
            localStorage.setItem('exnotic-watch-later', JSON.stringify(importedData.watchLater));
          }
          if (importedData.recentVideos) {
            localStorage.setItem('exnotic-recent-videos', JSON.stringify(importedData.recentVideos));
          }
          if (importedData.searchHistory) {
            localStorage.setItem('exnotic-search-history', JSON.stringify(importedData.searchHistory));
          }
          if (importedData.recommendationCache) {
            localStorage.setItem('exnotic-recommendation-cache', JSON.stringify(importedData.recommendationCache));
          }
          if (importedData.continueWatching) {
            localStorage.setItem('exnotic-continue-watching', JSON.stringify(importedData.continueWatching));
          }

          alert('Data imported successfully! The page will reload to apply all changes.');
          window.location.reload();
        }
      } catch (e) {
        console.error('Failed to import data:', e);
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  if (!isLoaded) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Customize your Exnotic experience</p>
        </div>

        {/* Video Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Video Settings
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Video Quality</Label>
                <p className="text-sm text-muted-foreground">Default video quality preference</p>
              </div>
              <Select
                value={settings.videoQuality}
                onValueChange={(value: any) => updateSetting('videoQuality', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Autoplay Videos</Label>
                <p className="text-sm text-muted-foreground">Automatically start playing videos</p>
              </div>
              <Switch
                checked={settings.autoplay}
                onCheckedChange={(checked) => updateSetting('autoplay', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Privacy & Bypass Settings */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Privacy & Bypass Settings
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  Auto Admin Block Bypass
                  <Badge variant="secondary" className="text-xs">🛡️ Recommended</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">Automatically try to bypass admin video restrictions</p>
              </div>
              <Switch
                checked={settings.autoBypass}
                onCheckedChange={(checked) => updateSetting('autoBypass', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Preferred Proxy Method</Label>
                <p className="text-sm text-muted-foreground">Choose which bypass method to try first</p>
              </div>
              <Select
                value={settings.preferredProxy}
                onValueChange={(value: any) => updateSetting('preferredProxy', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invidious">Invidious (Best)</SelectItem>
                  <SelectItem value="noembed">NoEmbed</SelectItem>
                  <SelectItem value="direct">Direct Stream</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Save Viewing History</Label>
                <p className="text-sm text-muted-foreground">Keep track of recently watched videos locally</p>
              </div>
              <Switch
                checked={settings.saveHistory}
                onCheckedChange={(checked) => updateSetting('saveHistory', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Appearance
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => updateSetting('darkMode', checked)}
            />
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-primary" />
            Data Management
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Clear Viewing History</Label>
                <p className="text-sm text-muted-foreground">Remove all recently watched videos</p>
              </div>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                Clear History
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Export All Data</Label>
                <p className="text-sm text-muted-foreground">Download all your data (settings, favorites, watch later, etc.) as a backup file</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportAllData} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export All Data
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Import Data</Label>
                <p className="text-sm text-muted-foreground">Restore your data from a previously exported backup file</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  style={{ display: 'none' }}
                  id="import-data-input"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => document.getElementById('import-data-input')?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Data
                </Button>
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-destructive">Clear All Data</Label>
                <p className="text-sm text-muted-foreground">Remove all settings and history (cannot be undone)</p>
              </div>
              <Button variant="destructive" size="sm" onClick={clearAllData}>
                Clear All
              </Button>
            </div>
          </div>
        </Card>

        {/* About This Version */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <h2 className="text-xl font-semibold mb-4">About This Version</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Version:</strong> 2.0.0 Beta</p>
            <p><strong>Features:</strong> Invidious Bypass, Trending Videos, Recently Viewed</p>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
            <div className="flex gap-2 mt-4">
              <Badge variant="secondary">🛡️ Ad-Free</Badge>
              <Badge variant="secondary">🔒 Privacy-First</Badge>
              <Badge variant="secondary">⚡ Fast</Badge>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}