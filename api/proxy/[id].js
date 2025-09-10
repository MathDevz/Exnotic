export default async function handler(req, res) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Return basic video info for proxy endpoint
    const videoData = {
      id,
      title: `Video ${id}`,
      channelTitle: 'Unknown Channel',
      description: 'Video description not available',
      thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
      duration: '',
      viewCount: '',
      publishedAt: ''
    };

    res.json(videoData);
  } catch (error) {
    console.error('Proxy endpoint error:', error);
    res.status(500).json({ error: 'Failed to fetch video data' });
  }
}