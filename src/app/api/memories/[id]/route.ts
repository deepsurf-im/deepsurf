import { NextRequest, NextResponse } from 'next/server';
import { deleteMemory } from '@/lib/mem0';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteMemory(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
} 