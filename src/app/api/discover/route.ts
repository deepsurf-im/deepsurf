import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { getOpenGraphData } from '@/lib/utils/ogScraper';
import { getGeminiModel } from '@/lib/providers/gemini';

export const GET = async (req: Request) => {
  try {
    const rssUrl = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
    const response = await axios.get(rssUrl);
    const parser = new XMLParser();
    const result = parser.parse(response.data);
    const items = result.rss.channel.item || [];
    const news = Array.isArray(items) ? items : [items];
    
    // Initialize Gemini model with Flash 2.0
    const model = getGeminiModel('gemini-2.0-flash-exp');
    
    // Process each news item to extract images and generate summaries
    const trendingQueries = await Promise.all(news.slice(0, 12).map(async (item: any) => {
      let imageUrl = item["media:content"]?.["$"]?.url || null;
      
      // If no image in RSS, try to fetch from the article page
      if (!imageUrl && item.link) {
        try {
          const ogData = await getOpenGraphData(item.link);
          if (ogData?.ogImage?.[0]?.url) {
            imageUrl = ogData.ogImage[0].url;
          }
        } catch (err) {
          console.log(`Failed to fetch image for: ${item.title}`);
        }
      }

      // Generate a summary using Gemini 2.0 Flash
      let summary = item.description;
      try {
        const chat = model.startChat();
        const prompt = `Summarize this news article in 2-3 sentences: ${item.title} - ${item.description}`;
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        summary = response.text();
      } catch (err) {
        console.log(`Failed to generate summary for: ${item.title}`);
      }
      
      return {
        title: item.title,
        content: summary,
        url: item.link,
        thumbnail: imageUrl || 'https://via.placeholder.com/400x225?text=No+Image',
        source: item.source?._ || (item["dc:creator"] || ''),
        timestamp: item.pubDate,
      };
    }));
    
    return Response.json(
      {
        blogs: trendingQueries,
      },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.error(`An error occurred in discover route: ${err}`);
    return Response.json(
      {
        message: 'An error has occurred',
      },
      {
        status: 500,
      }
    );
  }
};
