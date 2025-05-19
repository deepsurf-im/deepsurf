import { NextRequest, NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/providers/gemini';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { message: 'No file uploaded' },
        { status: 400 }
      );
    }

    const text = await file.text();

    // Generate summary using Gemini
    const model = getGeminiModel();
    const chat = model.startChat();
    const prompt = `Summarize the following document "${file.name}":\n\n${text}`;
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const summary = response.text();

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: file.type,
      text: text,
      summary: summary
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { message: 'Failed to process uploaded file' },
      { status: 500 }
    );
  }
} 