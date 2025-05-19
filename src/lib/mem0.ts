import mongoose from 'mongoose';

const MEM0_API_KEY = 'm0-VFsKFiGxCyjYSHGEMKWZpvLM9wRC0SBr0Y27y3aY';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://appleidmusic960:Dataking8@tapsidecluster.oeofi.mongodb.net/deepsurf';

// Memory Schema
const memorySchema = new mongoose.Schema({
  content: { type: String, required: true },
  metadata: {
    type: { type: String, required: true },
    timestamp: { type: Number, required: true },
    focusMode: String,
    optimizationMode: String,
    fileIds: [String],
    tags: [String],
  },
}, { timestamps: true });

// Create model if it doesn't exist
const Memory = mongoose.models.Memory || mongoose.model('Memory', memorySchema);

// Connect to MongoDB
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export interface Memory {
  id: string;
  content: string;
  metadata: {
    type: string;
    timestamp: number;
    focusMode?: string;
    optimizationMode?: string;
    fileIds?: string[];
    tags?: string[];
    [key: string]: any;
  };
}

export async function addMemory(
  content: string,
  type: string = 'text',
  metadata: Record<string, any> = {}
): Promise<Memory> {
  try {
    await connectDB();
    const memory = await Memory.create({
      content,
      metadata: {
        type,
        timestamp: Date.now(),
        ...metadata,
      },
    });
    return {
      id: memory._id.toString(),
      content: memory.content,
      metadata: memory.metadata,
    };
  } catch (error) {
    console.error('Error adding memory:', error);
    throw error;
  }
}

export async function getRecentMemories(limit: number = 10): Promise<Memory[]> {
  try {
    await connectDB();
    const memories = await Memory.find()
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit);
    return memories.map(memory => ({
      id: memory._id.toString(),
      content: memory.content,
      metadata: memory.metadata,
    }));
  } catch (error) {
    console.error('Error getting recent memories:', error);
    throw error;
  }
}

export async function searchMemories(query: string, limit: number = 10): Promise<Memory[]> {
  try {
    await connectDB();
    const memories = await Memory.find({
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { 'metadata.type': { $regex: query, $options: 'i' } },
      ],
    })
      .sort({ 'metadata.timestamp': -1 })
      .limit(limit);
    return memories.map(memory => ({
      id: memory._id.toString(),
      content: memory.content,
      metadata: memory.metadata,
    }));
  } catch (error) {
    console.error('Error searching memories:', error);
    throw error;
  }
}

export async function getMemory(id: string): Promise<Memory | null> {
  try {
    await connectDB();
    const memory = await Memory.findById(id);
    if (!memory) return null;
    return {
      id: memory._id.toString(),
      content: memory.content,
      metadata: memory.metadata,
    };
  } catch (error) {
    console.error('Error getting memory:', error);
    throw error;
  }
}

export async function deleteMemory(id: string): Promise<void> {
  try {
    await connectDB();
    await Memory.findByIdAndDelete(id);
  } catch (error) {
    console.error('Error deleting memory:', error);
    throw error;
  }
}

// Initialize connection
connectDB().catch(console.error); 