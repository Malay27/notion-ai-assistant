/**
 * Configuration Module
 * 
 * Centralized configuration management for the application.
 * 
 * @author Malay
 * @version 1.0.0-beta
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Python Backend Configuration (Primary AI processing)
  backend: {
    url: process.env.BACKEND_URL || 'http://localhost:8000',
    timeout: 60000, // Increased to 60 seconds for local AI models
    endpoints: {
      interpret: '/interpret',
      health: '/health'
    }
  },
  
  // Notion configuration
  notion: {
    token: process.env.NOTION_TOKEN,
    databases: {
      todo: process.env.TODO_DATABASE_ID,
      jobs: process.env.JOBS_DATABASE_ID
    }
  },
  
  // Application settings
  app: {
    name: 'Noto AI Assistant',
    version: '1.0.0-beta',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};
