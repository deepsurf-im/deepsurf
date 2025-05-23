import { RunnableSequence, RunnableMap } from '@langchain/core/runnables';
import ListLineOutputParser from '../outputParsers/listLineOutputParser';
import { PromptTemplate } from '@langchain/core/prompts';
import formatChatHistoryAsString from '../utils/formatHistory';
import { BaseMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';

const suggestionGeneratorPrompt = `
You are an AI suggestion generator for an AI powered search engine. You will be given a conversation below. You need to generate 3-4 suggestions based on the conversation. The suggestion should be relevant to the conversation that can be used by the user to ask the chat model for more information.
You need to make sure the suggestions are relevant to the conversation and are helpful to the user. Keep a note that the user might use these suggestions to ask a chat model for more information. 
Make sure the suggestions are medium in length and are informative and relevant to the conversation.

Provide these suggestions separated by newlines between the XML tags <suggestions> and </suggestions>. For example:

<suggestions>
Tell me more about SpaceX and their recent projects
What is the latest news on SpaceX?
Who is the CEO of SpaceX?
</suggestions>

Conversation:
{chat_history}
`;

type SuggestionGeneratorInput = {
  chat_history: BaseMessage[];
};

const outputParser = new ListLineOutputParser({
  key: 'suggestions',
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createSuggestionGeneratorChain = (llm: BaseChatModel) => {
  return RunnableSequence.from([
    RunnableMap.from({
      chat_history: (input: SuggestionGeneratorInput) =>
        formatChatHistoryAsString(input.chat_history),
    }),
    PromptTemplate.fromTemplate(suggestionGeneratorPrompt),
    llm,
    outputParser,
  ]);
};

const generateSuggestions = async (
  input: SuggestionGeneratorInput,
  llm: BaseChatModel,
) => {
  (llm as unknown as ChatOpenAI).temperature = 0;
  const suggestionGeneratorChain = createSuggestionGeneratorChain(llm);
  
  // Add retry logic with exponential backoff
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: any;

  while (retryCount < maxRetries) {
    try {
      return await suggestionGeneratorChain.invoke(input);
    } catch (error: any) {
      lastError = error;
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        // Wait with exponential backoff
        const waitTime = Math.pow(2, retryCount) * 1000;
        await delay(waitTime);
        retryCount++;
      } else {
        // For non-rate-limit errors, throw immediately
        throw error;
      }
    }
  }

  // If we've exhausted retries, throw the last error
  throw lastError;
};

export default generateSuggestions;
