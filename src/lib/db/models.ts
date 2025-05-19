import mongoose from 'mongoose';

interface File {
  name: string;
  fileId: string;
}

const messageSchema = new mongoose.Schema({
  content: { type: String, required: true },
  chatId: { type: String, required: true },
  messageId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['assistant', 'user'], required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  createdAt: { type: String, required: true },
  focusMode: { type: String, required: true },
  files: { type: [mongoose.Schema.Types.Mixed], default: [] }
});

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema); 