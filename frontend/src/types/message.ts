export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'action' | 'error' | 'success';
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  lastActivity: Date;
}