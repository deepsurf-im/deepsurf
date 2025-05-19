import OGS from 'open-graph-scraper';

const cache: Map<string, any> = new Map();

export const getOpenGraphData = async (url: string) => {
  try {
    if (cache.has(url)) {
      return cache.get(url);
    }

    const { error, result } = await OGS({
      url,
      fetchOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
      },
    });

    if (error || !result.ogImage) {
      return null;
    }

    cache.set(url, result);
    return result;
  } catch (err) {
    console.error('Error fetching Open Graph data:', err);
    return null;
  }
}; 