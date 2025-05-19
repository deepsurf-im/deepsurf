import axios from 'axios';
import * as cheerio from 'cheerio';

interface FaviconResult {
  url: string;
  size?: string;
  type?: string;
}

const getDefaultFavicon = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch (error) {
    return 'https://www.google.com/s2/favicons?domain=google.com&sz=64';
  }
};

const getFaviconFromHtml = async (url: string): Promise<FaviconResult[]> => {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 5000
    });
    const $ = cheerio.load(response.data);
    const favicons: FaviconResult[] = [];

    // Check for various favicon link tags
    $('link[rel*="icon"]').each((_, element) => {
      const href = $(element).attr('href');
      const sizes = $(element).attr('sizes');
      const type = $(element).attr('type');
      
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString();
          favicons.push({ url: absoluteUrl, size: sizes, type });
        } catch (error) {
          console.error('Invalid favicon URL:', href);
        }
      }
    });

    // Check for Apple Touch Icon
    $('link[rel="apple-touch-icon"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, url).toString();
          favicons.push({ url: absoluteUrl, type: 'apple-touch-icon' });
        } catch (error) {
          console.error('Invalid apple-touch-icon URL:', href);
        }
      }
    });

    // Check for Microsoft Tile Icon
    $('meta[name="msapplication-TileImage"]').each((_, element) => {
      const content = $(element).attr('content');
      if (content) {
        try {
          const absoluteUrl = new URL(content, url).toString();
          favicons.push({ url: absoluteUrl, type: 'msapplication-tile' });
        } catch (error) {
          console.error('Invalid msapplication-tile URL:', content);
        }
      }
    });

    // Add default favicon.ico as fallback
    try {
      const defaultFaviconUrl = new URL('/favicon.ico', url).toString();
      favicons.push({ url: defaultFaviconUrl, type: 'default' });
    } catch (error) {
      console.error('Invalid default favicon URL:', url);
    }

    return favicons;
  } catch (error) {
    console.error('Error fetching favicon from HTML:', error);
    return [];
  }
};

const getFaviconFromGoogle = async (url: string): Promise<string> => {
  try {
    const hostname = new URL(url).hostname;
    const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    const response = await axios.head(googleFaviconUrl);
    
    if (response.status === 200) {
      return googleFaviconUrl;
    }
    return getDefaultFavicon(url);
  } catch (error) {
    console.error('Error fetching favicon from Google:', error);
    return getDefaultFavicon(url);
  }
};

const validateFavicon = async (url: string): Promise<boolean> => {
  try {
    const response = await axios.head(url, {
      timeout: 3000,
      validateStatus: (status) => status < 400
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const getFavicon = async (url: string): Promise<string> => {
  return 'https://www.google.com/s2/favicons?domain=google.com&sz=64';
};

export const getFavicons = async (urls: string[]): Promise<Record<string, string>> => {
  const results: Record<string, string> = {};
  urls.forEach(url => {
    results[url] = 'https://www.google.com/s2/favicons?domain=google.com&sz=64';
  });
  return results;
};