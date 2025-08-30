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

export interface CommandInterpretation {
  action: string;
  entities: {
    title?: string;
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
    status?: string;
    category?: string;
    company?: string;
    position?: string;
    applicationLink?: string;
    resumeUsed?: string;
    notes?: string;
    nextStep?: string;
  };
  confidence: string;
  ai_analysis: {
    model: string;
    method: string;
    processing_time?: number;
  };
  status: 'success' | 'error';
}

export interface Task {
  id: string;
  title: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  status: string;
  applicationLink?: string;
  resumeUsed?: string;
  notes?: string;
  nextStep?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BackendStatus {
  success: boolean;
  data?: {
    service: string;
    version: string;
    ai_model: string;
    model_status: string;
    device: string;
  };
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
