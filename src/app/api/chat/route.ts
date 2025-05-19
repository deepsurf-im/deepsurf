import prompts from '@/lib/prompts';
import MetaSearchAgent from '@/lib/search/metaSearchAgent';
import crypto from 'crypto';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { EventEmitter } from 'stream';
import {
  chatModelProviders,
  embeddingModelProviders,
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '@/lib/providers';
import { getFileDetails } from '@/lib/utils/files';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatOpenAI } from '@langchain/openai';
import {
  getCustomOpenaiApiKey,
  getCustomOpenaiApiUrl,
  getCustomOpenaiModelName,
} from '@/lib/config';
import { searchHandlers } from '@/lib/search';
import connectDB from '@/lib/db/mongodb';
import { Chat, Message } from '@/lib/db/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Message = {
  messageId: string;
  chatId: string;
  content: string;
};

type ChatModel = {
  provider: string;
  name: string;
};

type EmbeddingModel = {
  provider: string;
  name: string;
};

type Body = {
  message: Message;
  optimizationMode: 'speed' | 'balanced' | 'quality';
  focusMode: string;
  history: Array<[string, string]>;
  files: Array<string>;
  chatModel: ChatModel;
  embeddingModel: EmbeddingModel;
  systemInstructions: string;
};

const handleEmitterEvents = async (
  stream: EventEmitter,
  writer: WritableStreamDefaultWriter,
  encoder: TextEncoder,
  aiMessageId: string,
  chatId: string,
) => {
  let recievedMessage = '';
  let sources: any[] = [];

  stream.on('data', (data) => {
    const parsedData = JSON.parse(data);
    if (parsedData.type === 'response') {
      writer.write(
        encoder.encode(
          JSON.stringify({
            type: 'message',
            data: parsedData.data,
            messageId: aiMessageId,
          }) + '\n',
        ),
      );

      recievedMessage += parsedData.data;
    } else if (parsedData.type === 'sources') {
      writer.write(
        encoder.encode(
          JSON.stringify({
            type: 'sources',
            data: parsedData.data,
            messageId: aiMessageId,
          }) + '\n',
        ),
      );

      sources = parsedData.data;
    }
  });
  stream.on('end', async () => {
    writer.write(
      encoder.encode(
        JSON.stringify({
          type: 'messageEnd',
          messageId: aiMessageId,
        }) + '\n',
      ),
    );
    writer.close();

    await connectDB();
    await Message.create({
      content: recievedMessage,
      chatId: chatId,
      messageId: aiMessageId,
      role: 'assistant',
      metadata: {
        createdAt: new Date(),
        ...(sources && sources.length > 0 && { sources }),
      },
    });
  });
  stream.on('error', (data) => {
    const parsedData = JSON.parse(data);
    writer.write(
      encoder.encode(
        JSON.stringify({
          type: 'error',
          data: parsedData.data,
        }),
      ),
    );
    writer.close();
  });
};

const handleHistorySave = async (
  message: Message,
  humanMessageId: string,
  focusMode: string,
  files: string[],
) => {
  await connectDB();

  const chat = await Chat.findOne({ id: message.chatId });

  if (!chat) {
    await Chat.create({
      id: message.chatId,
      title: message.content,
      createdAt: new Date().toString(),
      focusMode: focusMode,
      files: files.map(getFileDetails),
    });
  }

  const messageExists = await Message.findOne({ messageId: humanMessageId });

  if (!messageExists) {
    await Message.create({
      content: message.content,
      chatId: message.chatId,
      messageId: humanMessageId,
      role: 'user',
      metadata: {
        createdAt: new Date(),
      },
    });
  } else {
    await Message.deleteMany({
      chatId: message.chatId,
      createdAt: { $gt: messageExists.createdAt },
    });
  }
};

export const POST = async (req: Request) => {
  try {
    const body = (await req.json()) as Body;
    const { message } = body;

    if (message.content === '') {
      return Response.json(
        {
          message: 'Please provide a message to process',
        },
        { status: 400 },
      );
    }

    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider = chatModelProviders['gemini'];
    const chatModel = chatModelProvider['gemini-2.0-flash-exp'];

    const embeddingProvider = embeddingModelProviders['gemini'];
    const embeddingModel = embeddingProvider['models/text-embedding-004'];

    let llm: BaseChatModel | undefined = chatModel.model;
    let embedding = embeddingModel.model;

    if (!llm) {
      return Response.json({ error: 'Invalid chat model' }, { status: 400 });
    }

    if (!embedding) {
      return Response.json(
        { error: 'Invalid embedding model' },
        { status: 400 },
      );
    }

    const humanMessageId =
      message.messageId ?? crypto.randomBytes(7).toString('hex');
    const aiMessageId = crypto.randomBytes(7).toString('hex');

    const history: BaseMessage[] = body.history.map((msg) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    const handler = searchHandlers[body.focusMode];

    if (!handler) {
      return Response.json(
        {
          message: 'Invalid focus mode',
        },
        { status: 400 },
      );
    }

    const stream = await handler.searchAndAnswer(
      message.content,
      history,
      llm,
      embedding,
      body.optimizationMode,
      body.files,
      body.systemInstructions,
    );

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    handleEmitterEvents(stream, writer, encoder, aiMessageId, message.chatId);
    handleHistorySave(message, humanMessageId, body.focusMode, body.files);

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache, no-transform',
      },
    });
  } catch (err) {
    console.error('An error occurred while processing chat request:', err);
    return Response.json(
      { message: 'An error occurred while processing chat request' },
      { status: 500 },
    );
  }
};
