import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey } from '../config';
import { getFavicons } from '../utils/favicon';

export interface GeminiSearchResult {
  title: string;
  url: string;
  content: string;
  snippet: string;
  img_src?: string;
  favicon?: string;
}

export interface GeminiSearchResponse {
  results: GeminiSearchResult[];
  suggestions: string[];
  summary: string;
}

export async function searchGemini(
  query: string,
  options: {
    language?: string;
    engines?: string[];
  } = {},
): Promise<GeminiSearchResponse> {
  const genAI = new GoogleGenerativeAI(getGeminiApiKey());
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Create a chat session with search capability
  const chat = model.startChat({
    tools: [
      {
        // @ts-ignore - google_search is a valid tool but not typed in the SDK yet
        google_search: {},
      },
    ],
  });

  // Generate content with search tool
  const result = await chat.sendMessage(`Search the web for information about "${query}". Please provide detailed information and cite your sources.`);
  const response = await result.response;
  const text = response.text();

  // Extract sources from grounding metadata
  const sourceMap = new Map<string, GeminiSearchResult>();
  const metadata = response.candidates?.[0]?.groundingMetadata as any;

  if (metadata) {
    const chunks = metadata.groundingChunks || [];
    const supports = metadata.groundingSupports || [];

    chunks.forEach((chunk: any, index: number) => {
      if (chunk.web?.uri && chunk.web?.title) {
        const url = chunk.web.uri;
        if (!sourceMap.has(url)) {
          // Find snippets that reference this chunk
          const snippets = supports
            .filter((support: any) =>
              support.groundingChunkIndices.includes(index)
            )
            .map((support: any) => support.segment.text)
            .join(" ");

          sourceMap.set(url, {
            title: chunk.web.title,
            url: url,
            content: chunk.web.snippet || "",
            snippet: snippets || "",
          });
        }
      }
    });
  }

  // Convert source map to array
  const results = Array.from(sourceMap.values());

  // Fetch favicons for all results using Google's favicon service
  const urls = results.map(result => result.url);
  const favicons = await getFavicons(urls);

  // Add favicons to results
  results.forEach(result => {
    result.favicon = favicons[result.url] || `https://www.google.com/s2/favicons?domain=${new URL(result.url).hostname}`;
  });

  // Extract suggestions from the response
  const suggestions: string[] = [];
  const suggestionMatches = text.match(/Suggestions?: (.*?)(?:\n|$)/g);
  if (suggestionMatches) {
    suggestions.push(...suggestionMatches.map(match => match.replace(/Suggestions?: /, '').trim()));
  }

  // Format the response text as summary
  const summary = text
    .replace(/Sources?:[\s\S]*$/, '') // Remove sources section
    .replace(/Suggestions?:[\s\S]*$/, '') // Remove suggestions section
    .trim();

  return {
    results,
    suggestions,
    summary,
  };
} 