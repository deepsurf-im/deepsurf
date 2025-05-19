import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedMedia {
  images: string[];
  videos: string[];
}

export async function scrapeMediaFromUrl(url: string): Promise<ScrapedMedia> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000, // 10 second timeout
      maxRedirects: 5
    });

    const $ = cheerio.load(response.data);
    const images: string[] = [];
    const videos: string[] = [];

    // Scrape images from various sources
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      const dataSrc = $(element).attr('data-src');
      const dataOriginal = $(element).attr('data-original');
      const srcset = $(element).attr('srcset');
      
      // Handle srcset attribute
      if (srcset) {
        const srcsetUrls = srcset.split(',')
          .map(src => src.trim().split(' ')[0])
          .filter(Boolean);
        srcsetUrls.forEach(src => {
          try {
            const absoluteUrl = new URL(src, url).toString();
            images.push(absoluteUrl);
          } catch (error) {
            console.error('Invalid srcset URL:', src);
          }
        });
      }

      // Handle regular src
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).toString();
          images.push(absoluteUrl);
        } catch (error) {
          console.error('Invalid src URL:', src);
        }
      }

      // Handle data-src (lazy loading)
      if (dataSrc) {
        try {
          const absoluteUrl = new URL(dataSrc, url).toString();
          images.push(absoluteUrl);
        } catch (error) {
          console.error('Invalid data-src URL:', dataSrc);
        }
      }

      // Handle data-original
      if (dataOriginal) {
        try {
          const absoluteUrl = new URL(dataOriginal, url).toString();
          images.push(absoluteUrl);
        } catch (error) {
          console.error('Invalid data-original URL:', dataOriginal);
        }
      }
    });

    // Scrape background images from inline styles
    $('[style*="background-image"]').each((_, element) => {
      const style = $(element).attr('style');
      if (style) {
        const match = style.match(/url\(['"]?([^'"()]+)['"]?\)/);
        if (match && match[1]) {
          try {
            const absoluteUrl = new URL(match[1], url).toString();
            images.push(absoluteUrl);
          } catch (error) {
            console.error('Invalid background-image URL:', match[1]);
          }
        }
      }
    });

    // Scrape videos
    $('video').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        try {
          const absoluteUrl = new URL(src, url).toString();
          videos.push(absoluteUrl);
        } catch (error) {
          console.error('Invalid video URL:', src);
        }
      }
    });

    // Check for video iframes (YouTube, Vimeo, etc.)
    $('iframe').each((_, element) => {
      const src = $(element).attr('src');
      if (src && (src.includes('youtube.com') || src.includes('vimeo.com'))) {
        videos.push(src);
      }
    });

    // Filter out invalid URLs and duplicates
    const validImages = [...new Set(images)].filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    const validVideos = [...new Set(videos)].filter(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });

    return {
      images: validImages,
      videos: validVideos
    };
  } catch (error) {
    console.error(`Error scraping media from ${url}:`, error);
    return { images: [], videos: [] };
  }
}

export async function scrapeMediaFromUrls(urls: string[]): Promise<Record<string, ScrapedMedia>> {
  const results: Record<string, ScrapedMedia> = {};
  
  // Process URLs in parallel with a concurrency limit
  const concurrencyLimit = 3;
  const chunks = [];
  
  for (let i = 0; i < urls.length; i += concurrencyLimit) {
    chunks.push(urls.slice(i, i + concurrencyLimit));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map(async (url) => {
        try {
          const media = await scrapeMediaFromUrl(url);
          return { url, media };
        } catch (error) {
          console.error(`Error processing URL ${url}:`, error);
          return { url, media: { images: [], videos: [] } };
        }
      })
    );

    chunkResults.forEach(({ url, media }) => {
      results[url] = media;
    });
  }

  return results;
} 