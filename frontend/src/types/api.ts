export interface CommandInterpretation {
  action: string;
  entities: {
    title?: string;
    dueDate?: string;
    priority?: "low" | "medium" | "high";
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
  status: "success" | "error";
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
