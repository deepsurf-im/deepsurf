import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Chat } from '@/lib/models/Chat';
import { Document, Types } from 'mongoose';

interface ChatDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface LeanChat {
  _id: Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Find only the user's chats and sort by most recent
    const chats = await Chat.find({ 
      userId: session.user.id 
    })
    .sort({ updatedAt: -1 })
    .select('title createdAt updatedAt _id')
    .lean() as unknown as LeanChat[];

    // Format dates to ISO strings for consistent handling
    const formattedChats = chats.map(chat => ({
      _id: chat._id.toString(),
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    }));

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message } = await request.json();
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create new chat with explicit userId
    const chat = await Chat.create({
      userId: session.user.id,
      title,
      messages: [{
        role: 'user',
        content: message,
        timestamp: new Date()
      }]
    }) as ChatDocument;

    return NextResponse.json({
      _id: chat._id.toString(),
      title: chat.title,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
