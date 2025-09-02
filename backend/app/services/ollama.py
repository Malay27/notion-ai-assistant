"""
Ollama AI service for local language model integration.
"""

import json
import requests
from typing import Optional, Tuple, Dict, Any

from app.core import settings, logger


class OllamaService:
    """Service for interacting with Ollama local AI."""
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        self.timeout = settings.ollama_timeout
        
    def check_availability(self) -> Tuple[bool, str]:
        """Check if Ollama is running and model is available."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                available_models = [model.get("name", "") for model in models]
                
                # Check if our target model is available
                model_available = any(self.model in model for model in available_models)
                
                if model_available:
                    return True, f"Ollama running, {self.model} available"
                else:
                    return False, f"Ollama running but {self.model} not found. Available: {available_models}"
            else:
                return False, f"Ollama API responded with status: {response.status_code}"
        except Exception as e:
            return False, f"Ollama not available: {e}"
    
    def generate_completion(self, prompt: str) -> Optional[str]:
        """Generate completion using Ollama."""
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": settings.ollama_temperature,
                    "top_p": settings.ollama_top_p,
                    "num_predict": settings.ollama_num_predict
                }
            }
            
            logger.info(f"Sending request to Ollama: {self.base_url}/api/generate")
            response = requests.post(
                f"{self.base_url}/api/generate", 
                json=payload, 
                timeout=self.timeout
            )
            
            logger.info(f"Ollama Response Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                generated_text = result.get("response", "").strip()
                logger.info(f"Ollama generated: {generated_text}")
                return generated_text
            else:
                logger.warning(f"Ollama API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Ollama generation failed: {e}")
            return None
    
    def create_command_prompt(self, command: str) -> str:
        """Create a structured prompt for command interpretation."""
        return f"""You are a smart task management assistant. Your job is to understand user commands in natural language and convert them into structured JSON format.

INSTRUCTIONS:
1. Analyze the user command to determine the correct action type
2. Extract relevant details like task title, due date, priority, and status
3. Return ONLY valid JSON format - no extra text or explanations

POSSIBLE ACTIONS:
- addTask: Creating new tasks
- updateTask: Modifying existing tasks  
- completeTask: Marking tasks as done
- deleteTask: Removing tasks
- listTasks: Showing all tasks
- searchTask: Finding specific tasks
- getTasksByPriority: Filter by priority level
- getTasksByStatus: Filter by completion status
- addJob: Adding job applications
- searchJob: Finding job applications

PRIORITY LEVELS: highest, high, medium, low, lowest
STATUS OPTIONS: not started, in progress, done
DUE DATE FORMAT: particular date and if this week/weekend/next week is specified then consider first day of the specified period

REQUIRED JSON FORMAT (MUST include "action" field):
{{
  "action": "chosen_action_from_list_above",
  "entities": {{
    "title": "extracted_task_title",
    "dueDate": "extracted_due_date",
    "priority": "extracted_priority",
    "status": "extracted_status"
  }}
}}

USER COMMAND: {command}

JSON OUTPUT:"""


# Global service instance
ollama_service = OllamaService()
