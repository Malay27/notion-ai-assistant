export interface Task {
  id: string;
  title: string;
  status: string;
  priority: "low" | "medium" | "high";
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
