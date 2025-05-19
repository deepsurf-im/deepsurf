import { Embeddings } from '@langchain/core/embeddings';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  loadGeminiChatModels,
  loadGeminiEmbeddingModels,
  PROVIDER_INFO as GeminiInfo,
} from './gemini';

export const PROVIDER_METADATA = {
  gemini: GeminiInfo,
};

export interface ChatModel {
  displayName: string;
  model: BaseChatModel;
}

export interface EmbeddingModel {
  displayName: string;
  model: Embeddings;
}

export const chatModelProviders: Record<
  string,
  () => Promise<Record<string, ChatModel>>
> = {
  gemini: loadGeminiChatModels,
};

export const embeddingModelProviders: Record<
  string,
  () => Promise<Record<string, EmbeddingModel>>
> = {
  gemini: loadGeminiEmbeddingModels,
};

export const getAvailableChatModelProviders = async () => {
  const models: Record<string, Record<string, ChatModel>> = {};

  for (const provider in chatModelProviders) {
    const providerModels = await chatModelProviders[provider]();
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  return models;
};

export const getAvailableEmbeddingModelProviders = async () => {
  const models: Record<string, Record<string, EmbeddingModel>> = {};

  for (const provider in embeddingModelProviders) {
    const providerModels = await embeddingModelProviders[provider]();
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  return models;
};
