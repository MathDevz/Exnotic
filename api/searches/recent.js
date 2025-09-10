import { storage } from "../_storage.js";

export default async function handler(req, res) {
  try {
    const recentSearches = await storage.getRecentSearches();
    res.json(recentSearches);
  } catch (error) {
    console.error("Recent searches error:", error);
    res.status(500).json({ error: "Failed to fetch recent searches" });
  }
}