import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { ChatOpenAI } from '@langchain/openai';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { MetaSearchAgentType } from '@/lib/search/metaSearchAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { searchHandlers } from '@/lib/search';
import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/providers/gemini';
import * as cheerio from 'cheerio';

interface chatModel {
  provider: string;
  name: string;
  customOpenAIKey?: string;
  customOpenAIBaseURL?: string;
}

interface embeddingModel {
  provider: string;
  name: string;
}

interface ChatRequestBody {
  optimizationMode: 'speed' | 'balanced';
  focusMode: string;
  chatModel?: chatModel;
  embeddingModel?: embeddingModel;
  query: string;
  history: Array<[string, string]>;
  stream?: boolean;
  systemInstructions?: string;
}

interface ScrapedArticle {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  source: string;
  publishedAt: string;
  category?: string;
}

async function scrapeArticle(url: string): Promise<ScrapedArticle | null> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const getMetaContent = (name: string) => {
      return $(`meta[property="${name}"], meta[name="${name}"]`).attr('content') || null;
    };

    const getFirstImage = () => {
      const ogImage = getMetaContent('og:image');
      if (ogImage) return ogImage;

      // Find the largest image that's likely to be the main image
      let largestImage = null;
      let maxArea = 0;

      $('img').each((_, img) => {
        const width = parseInt($(img).attr('width') || '0');
        const height = parseInt($(img).attr('height') || '0');
        const area = width * height;

        if (area > maxArea && width > 200 && height > 200 && width / height < 3) {
          maxArea = area;
          largestImage = $(img).attr('src');
        }
      });

      return largestImage;
    };

    const getDescription = () => {
      const ogDesc = getMetaContent('og:description');
      if (ogDesc) return ogDesc;

      const metaDesc = getMetaContent('description');
      if (metaDesc) return metaDesc;

      // Find the first meaningful paragraph
      let firstParagraph: string | null = null;
      $('p').each((_, p) => {
        const text = $(p).text().trim();
        if (text.length > 100 && !firstParagraph) {
          firstParagraph = text;
        }
      });

      return firstParagraph;
    };

    const title = getMetaContent('og:title') || $('title').text() || '';
    const description = getDescription() || '';
    const imageUrl = getFirstImage() || '';
    const source = new URL(url).hostname.replace('www.', '');
    const publishedAt = new Date().toISOString();

    return {
      title,
      description: description.slice(0, 200) + '...',
      url,
      imageUrl,
      source,
      publishedAt,
    };
  } catch (error) {
    console.error('Error scraping article:', error);
    return null;
  }
}

export const POST = async (req: Request) => {
  try {
    const body: ChatRequestBody = await req.json();

    if (!body.focusMode || !body.query) {
      return Response.json(
        { message: 'Missing focus mode or query' },
        { status: 400 },
      );
    }

    body.history = body.history || [];
    body.optimizationMode = body.optimizationMode || 'balanced';
    body.stream = body.stream || true;

    const history: BaseMessage[] = body.history.map((msg) => {
      return msg[0] === 'human'
        ? new HumanMessage({ content: msg[1] })
        : new AIMessage({ content: msg[1] });
    });

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel =
      body.chatModel?.name ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    const embeddingModelProvider =
      body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0];
    const embeddingModel =
      body.embeddingModel?.name ||
      Object.keys(embeddingModelProviders[embeddingModelProvider])[0];

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        modelName: body.chatModel?.name || getCustomOpenaiModelName(),
        openAIApiKey:
          body.chatModel?.customOpenAIKey || getCustomOpenaiApiKey(),
        temperature: 0.7,
        configuration: {
          baseURL:
            body.chatModel?.customOpenAIBaseURL || getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel]
        .model as unknown as BaseChatModel | undefined;
    }

    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][
        embeddingModel
      ].model as Embeddings | undefined;
    }

    if (!llm || !embeddings) {
      return Response.json(
        { message: 'Invalid model selected' },
        { status: 400 },
      );
    }

    const searchHandler: MetaSearchAgentType = searchHandlers[body.focusMode];

    if (!searchHandler) {
      return Response.json({ message: 'Invalid focus mode' }, { status: 400 });
    }

    const emitter = await searchHandler.searchAndAnswer(
      body.query,
      history,
      llm,
      embeddings,
      body.optimizationMode,
      [],
      body.systemInstructions || '',
    );

    if (!body.stream) {
      return new Promise(
        (
          resolve: (value: Response) => void,
          reject: (value: Response) => void,
        ) => {
          let message = '';
          let sources: any[] = [];

          emitter.on('data', (data: string) => {
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.type === 'response') {
                message += parsedData.data;
              } else if (parsedData.type === 'sources') {
                sources = parsedData.data;
              }
            } catch (error) {
              reject(
                Response.json(
                  { message: 'Error parsing data' },
                  { status: 500 },
                ),
              );
            }
          });

          emitter.on('end', () => {
            resolve(Response.json({ message, sources }, { status: 200 }));
          });

          emitter.on('error', (error: any) => {
            reject(
              Response.json(
                { message: 'Search error', error },
                { status: 500 },
              ),
            );
          });
        },
      );
    }

    const encoder = new TextEncoder();

    const abortController = new AbortController();
    const { signal } = abortController;

    const stream = new ReadableStream({
      start(controller) {
        let sources: any[] = [];

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: 'init',
              data: 'Stream connected',
            }) + '\n',
          ),
        );

        signal.addEventListener('abort', () => {
          emitter.removeAllListeners();

          try {
            controller.close();
          } catch (error) {}
        });

        emitter.on('data', (data: string) => {
          if (signal.aborted) return;

          try {
            const parsedData = JSON.parse(data);

            if (parsedData.type === 'response') {
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'response',
                    data: parsedData.data,
                  }) + '\n',
                ),
              );
            } else if (parsedData.type === 'sources') {
              sources = parsedData.data;
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: 'sources',
                    data: sources,
                  }) + '\n',
                ),
              );
            }
          } catch (error) {
            controller.error(error);
          }
        });

        emitter.on('end', () => {
          if (signal.aborted) return;

          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'done',
              }) + '\n',
            ),
          );
          controller.close();
        });

        emitter.on('error', (error: any) => {
          if (signal.aborted) return;

          controller.error(error);
        });
      },
      cancel() {
        abortController.abort();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error(`Error in getting search results: ${err.message}`);
    return Response.json(
      { message: 'An error has occurred.' },
      { status: 500 },
    );
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');

    if (!query) {
      return NextResponse.json(
        { message: 'Missing query parameter' },
        { status: 400 }
      );
    }

    // Handle news search
    if (type === 'news') {
      const NEWS_API_KEY = process.env.NEWS_API_KEY;
      const NEWS_API_URL = 'https://newsapi.org/v2';

      if (!NEWS_API_KEY) {
        return NextResponse.json(
          { message: 'News API key not configured' },
          { status: 500 }
        );
      }

      const response = await fetch(
        `${NEWS_API_URL}/everything?q=${encodeURIComponent(
          query
        )}&language=en&sortBy=relevancy&apiKey=${NEWS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      const articles = await Promise.all(
        data.articles.map(async (article: any) => {
          const scrapedArticle = await scrapeArticle(article.url);
          return scrapedArticle || article;
        })
      );

      return NextResponse.json({ articles });
    }

    // Handle web search
    const response = await fetch(
      `https://searx.nixnet.services/search?q=${encodeURIComponent(
        query
      )}&format=json&engines=google,bing,duckduckgo`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data = await response.json();
    const results = await Promise.all(
      data.results.map(async (result: any) => {
        const scrapedArticle = await scrapeArticle(result.url);
        return scrapedArticle || result;
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { message: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
