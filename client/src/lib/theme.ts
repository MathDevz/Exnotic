
// Theme management using CSS variable overrides
export const applyTheme = (isDark: boolean) => {
  const root = document.documentElement;
  
  if (isDark) {
    // Apply dark theme variables
    root.style.setProperty('--background', 'hsl(0, 0%, 4%)');
    root.style.setProperty('--foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--card', 'hsl(0, 0%, 10%)');
    root.style.setProperty('--card-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--popover', 'hsl(0, 0%, 10%)');
    root.style.setProperty('--popover-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--primary', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--secondary', 'hsl(0, 0%, 15%)');
    root.style.setProperty('--secondary-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--muted', 'hsl(0, 0%, 25%)');
    root.style.setProperty('--muted-foreground', 'hsl(0, 0%, 65%)');
    root.style.setProperty('--accent', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--accent-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--destructive', 'hsl(0, 83%, 58%)');
    root.style.setProperty('--destructive-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--border', 'hsl(0, 0%, 30%)');
    root.style.setProperty('--input', 'hsl(0, 0%, 15%)');
    root.style.setProperty('--ring', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--sidebar', 'hsl(0, 0%, 10%)');
    root.style.setProperty('--sidebar-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--sidebar-primary', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--sidebar-primary-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--sidebar-accent', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--sidebar-accent-foreground', 'hsl(0, 0%, 80%)');
    root.style.setProperty('--sidebar-border', 'hsl(0, 0%, 20%)');
    root.style.setProperty('--sidebar-ring', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--border', 'hsl(0, 0%, 20%)');
    root.style.setProperty('--input', 'hsl(0, 0%, 20%)');
    root.style.setProperty('--separator', 'hsl(0, 0%, 20%)');
  } else {
    // Apply light theme variables
    root.style.setProperty('--background', 'hsl(0, 0%, 100%)');
    root.style.setProperty('--foreground', 'hsl(240, 10%, 3.9%)');
    root.style.setProperty('--card', 'hsl(0, 0%, 100%)');
    root.style.setProperty('--card-foreground', 'hsl(240, 10%, 3.9%)');
    root.style.setProperty('--popover', 'hsl(0, 0%, 100%)');
    root.style.setProperty('--popover-foreground', 'hsl(240, 10%, 3.9%)');
    root.style.setProperty('--primary', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--primary-foreground', 'hsl(0, 0%, 98%)');
    root.style.setProperty('--secondary', 'hsl(240, 4.8%, 95.9%)');
    root.style.setProperty('--secondary-foreground', 'hsl(240, 5.9%, 10%)');
    root.style.setProperty('--muted', 'hsl(240, 4.8%, 95.9%)');
    root.style.setProperty('--muted-foreground', 'hsl(240, 3.8%, 46.1%)');
    root.style.setProperty('--accent', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--accent-foreground', 'hsl(0, 0%, 98%)');
    root.style.setProperty('--destructive', 'hsl(0, 84.2%, 60.2%)');
    root.style.setProperty('--destructive-foreground', 'hsl(0, 0%, 98%)');
    root.style.setProperty('--border', 'hsl(0, 0%, 30%)');
    root.style.setProperty('--input', 'hsl(0, 0%, 30%)');
    root.style.setProperty('--ring', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--sidebar', 'hsl(0, 0%, 100%)');
    root.style.setProperty('--sidebar-foreground', 'hsl(240, 10%, 3.9%)');
    root.style.setProperty('--sidebar-primary', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--sidebar-primary-foreground', 'hsl(0, 0%, 98%)');
    root.style.setProperty('--sidebar-accent', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--sidebar-accent-foreground', 'hsl(0, 0%, 98%)');
    root.style.setProperty('--sidebar-border', 'hsl(0, 0%, 30%)');
    root.style.setProperty('--sidebar-ring', 'hsl(262, 83%, 58%)');
    root.style.setProperty('--separator', 'hsl(0, 0%, 30%)');
  }
};

export const getThemeFromSettings = (): boolean => {
  try {
    const settings = localStorage.getItem('exnotic-settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.darkMode !== false; // Default to true if not specified
    }
  } catch (e) {
    console.log('Failed to load theme from settings');
  }
  // Check if user has never set a preference, default to dark
  return true;
};

export const initializeTheme = () => {
  // First check if user has settings
  const settings = localStorage.getItem('exnotic-settings');
  let isDark = true; // Default to dark

  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      isDark = parsed.darkMode !== false;
    } catch (e) {
      console.log('Failed to parse settings, using dark theme');
    }
  } else {
    // No settings exist, create default settings with dark mode
    const defaultSettings = {
      videoQuality: 'auto',
      autoBypass: true,
      darkMode: true,
      autoplay: false,
      saveHistory: true,
      preferredProxy: 'invidious'
    };
    localStorage.setItem('exnotic-settings', JSON.stringify(defaultSettings));
  }

  applyTheme(isDark);
  return isDark;
};
