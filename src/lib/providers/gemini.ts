import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ChatGoogleGenerativeAI,
  GoogleGenerativeAIEmbeddings,
} from '@langchain/google-genai';
import { getGeminiApiKey } from '../config';
import { ChatModel, EmbeddingModel } from '.';

export const PROVIDER_INFO = {
  key: 'gemini',
  displayName: 'Google Gemini',
};
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export const geminiModels = {
  "Gemini 2.0 Flash": {
    key: "gemini-2.0-flash-exp",
    displayName: "Gemini 2.0 Flash",
    description: "Fast and efficient model for quick responses",
    maxTokens: 2048,
    temperature: 0.9,
    topP: 1,
    topK: 1,
  },
  "Gemini 2.0 Flash-Lite": {
    key: "gemini-2.0-flash-lite",
    displayName: "Gemini 2.0 Flash-Lite",
    description: "Lightweight version for faster responses",
    maxTokens: 2048,
    temperature: 0.9,
    topP: 1,
    topK: 1,
  }
};

export const getGeminiModel = (modelKey: string = "gemini-2.0-flash-exp") => {
  return genAI.getGenerativeModel({
    model: modelKey,
    generationConfig: {
      temperature: 0.9,
      topP: 1,
      topK: 1,
      maxOutputTokens: 2048,
    },
  });
};

const geminiChatModels: Record<string, string>[] = [
  {
    displayName: 'Gemini 2.0 Flash',
    key: 'gemini-2.0-flash-exp',
  },
  {
    displayName: 'Gemini 2.0 Flash-Lite',
    key: 'gemini-2.0-flash-lite',
  },
  {
    displayName: 'Gemini 2.0 Flash Thinking Experimental',
    key: 'gemini-2.0-flash-thinking-exp-01-21',
  },
  {
    displayName: 'Gemini 1.5 Flash',
    key: 'gemini-1.5-flash',
  },
  {
    displayName: 'Gemini 1.5 Flash-8B',
    key: 'gemini-1.5-flash-8b',
  }
];

const geminiEmbeddingModels: Record<string, string>[] = [
  {
    displayName: 'Text Embedding 004',
    key: 'models/text-embedding-004',
  },
  {
    displayName: 'Embedding 001',
    key: 'models/embedding-001',
  },
];

export const loadGeminiChatModels = async () => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) return {};

  try {
    const chatModels: Record<string, ChatModel> = {};

    geminiChatModels.forEach((model) => {
      chatModels[model.key] = {
        displayName: model.displayName,
        model: new ChatGoogleGenerativeAI({
          apiKey: geminiApiKey,
          modelName: model.key,
          temperature: 0.7,
        }) as unknown as BaseChatModel,
      };
    });

    return chatModels;
  } catch (err) {
    console.error(`Error loading Gemini models: ${err}`);
    return {};
  }
};

export const loadGeminiEmbeddingModels = async () => {
  const geminiApiKey = getGeminiApiKey();

  if (!geminiApiKey) return {};

  try {
    const embeddingModels: Record<string, EmbeddingModel> = {};

    geminiEmbeddingModels.forEach((model) => {
      embeddingModels[model.key] = {
        displayName: model.displayName,
        model: new GoogleGenerativeAIEmbeddings({
          apiKey: geminiApiKey,
          modelName: model.key,
        }) as unknown as Embeddings,
      };
    });

    return embeddingModels;
  } catch (err) {
    console.error(`Error loading OpenAI embeddings models: ${err}`);
    return {};
  }
};
