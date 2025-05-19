import { NextRequest, NextResponse } from 'next/server';
import { addMemory, getRecentMemories } from '@/lib/mem0';

export async function GET(req: NextRequest) {
  const url = new URL(req.url!);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  try {
    const memories = await getRecentMemories(limit);
    return NextResponse.json(memories);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch memories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content, type, metadata } = await req.json();
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    const memory = await addMemory(content, type, metadata);
    return NextResponse.json(memory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add memory' }, { status: 500 });
  }
} 