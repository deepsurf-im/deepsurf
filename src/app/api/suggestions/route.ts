import generateSuggestions from '@/lib/chains/suggestionGeneratorAgent';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { getAvailableChatModelProviders } from '@/lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';

interface ChatModel {
  provider: string;
  model: string;
}

interface SuggestionsGenerationBody {
  chatHistory: any[];
  chatModel?: ChatModel;
}

export const POST = async (req: Request) => {
  try {
    const body: SuggestionsGenerationBody = await req.json();

    const chatHistory = body.chatHistory
      .map((msg: any) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content);
        } else if (msg.role === 'assistant') {
          return new AIMessage(msg.content);
        }
        return undefined;
      })
      .filter((msg): msg is BaseMessage => msg !== undefined);

    const chatModelProviders = await getAvailableChatModelProviders();
    
    // Find the first provider that has gemini-2.0-flash
    const defaultProvider = Object.keys(chatModelProviders).find(p => 
      chatModelProviders[p]?.['gemini-2.0-flash']
    ) || Object.keys(chatModelProviders)[0];

    const chatModelProvider = chatModelProviders[body.chatModel?.provider || defaultProvider];
    if (!chatModelProvider) {
      return Response.json({ error: 'Invalid chat model provider' }, { status: 400 });
    }

    const defaultModel = 'gemini-2.0-flash';
    const chatModel = chatModelProvider[body.chatModel?.model || defaultModel] || 
                     chatModelProvider[Object.keys(chatModelProvider)[0]];
    
    if (!chatModel) {
      return Response.json({ error: 'Invalid chat model' }, { status: 400 });
    }

    let llm: BaseChatModel;

    if (body.chatModel?.provider === 'custom_openai') {
      llm = new ChatOpenAI({
        openAIApiKey: getCustomOpenaiApiKey(),
        modelName: getCustomOpenaiModelName(),
        temperature: 0.7,
        configuration: {
          baseURL: getCustomOpenaiApiUrl(),
        },
      }) as unknown as BaseChatModel;
    } else {
      llm = chatModel.model;
    }

    const suggestions = await generateSuggestions(
      {
        chat_history: chatHistory,
      },
      llm,
    );

    return Response.json({ suggestions }, { status: 200 });

  } catch (error: any) {
    console.error(`Error generating suggestions: ${error}`);
    
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return Response.json(
        { 
          message: 'Rate limit exceeded. Please try again in a few moments.',
          error: error.message 
        },
        { status: 429 }
      );
    }

    return Response.json(
      { 
        message: 'An error occurred while generating suggestions',
        error: error.message 
      },
      { status: 500 }
    );
  }
};
