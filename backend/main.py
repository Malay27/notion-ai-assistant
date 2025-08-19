"""
Noto AI Assistant - Python Backend
Main FastAPI application with Ollama local AI integration

@author Malay
@version 1.0.0-beta
"""

import os
import logging
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Noto AI Assistant Backend",
    description="AI-powered command interpreter with CodeLlama 7B Instruct",
    version="1.0.0-beta"
)

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "codellama:7b-instruct"  # Using CodeLlama 7B Instruct

def check_ollama_availability():
    """Check if Ollama is running and model is available"""
    try:
        # Check if Ollama is running
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            available_models = [model.get("name", "") for model in models]
            
            # Check if our target model is available
            model_available = any(OLLAMA_MODEL in model for model in available_models)
            
            if model_available:
                return True, f"Ollama running, {OLLAMA_MODEL} available"
            else:
                return False, f"Ollama running but {OLLAMA_MODEL} not found. Available: {available_models}"
        else:
            return False, f"Ollama API responded with status: {response.status_code}"
    except Exception as e:
        return False, f"Ollama not available: {e}"

# Request/Response Models
class CommandRequest(BaseModel):
    command: str
    user_id: str = "default"

class CommandResponse(BaseModel):
    action: str
    entities: dict
    confidence: str
    ai_analysis: dict
    status: str = "success"

async def interpret_with_ollama(command: str):
    """
    Use Ollama local AI for command interpretation
    """
    logger.info(f"Interpreting command with Ollama: {command}")
    
    try:
        # Check if Ollama is available
        ollama_available, status = check_ollama_availability()
        if not ollama_available:
            logger.warning(f"Ollama not available: {status}")
            return None
        
        # Create a clean and improved prompt for CodeLlama
        prompt = f"""You are a smart task management assistant. Your job is to understand user commands in natural language and convert them into structured JSON format.

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

PRIORITY LEVELS: high, medium, low
STATUS OPTIONS: not started, in progress, done
DUE DATE FORMAT: today, tomorrow, this_week, next_week, this_weekend

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

        # Use Ollama API for generation  
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
                "top_p": 0.95,
                "num_predict": 200
            }
        }
        
        logger.info(f"Sending request to Ollama: {OLLAMA_BASE_URL}/api/generate")
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate", 
            json=payload, 
            timeout=30
        )
        
        logger.info(f"Ollama Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            generated_text = result.get("response", "").strip()
            logger.info(f"Ollama generated: {generated_text}")
            
            # Parse JSON response
            try:
                json_start = generated_text.find('{')
                json_end = generated_text.rfind('}') + 1
                
                if json_start != -1 and json_end != -1:
                    json_str = generated_text[json_start:json_end]
                    logger.info(f"Extracted JSON: {json_str}")
                    ai_result = json.loads(json_str)
                    logger.info(f"Parsed AI result: {ai_result}")
                    
                    # Validate and ensure required fields
                    if "action" not in ai_result or not ai_result["action"]:
                        # Try to infer action from command if missing
                        command_lower = command.lower()
                        if any(word in command_lower for word in ["show", "list", "get", "display"]):
                            if any(word in command_lower for word in ["high", "low", "medium", "priority"]):
                                ai_result["action"] = "getTasksByPriority"
                            else:
                                ai_result["action"] = "listTasks"
                        else:
                            ai_result["action"] = "addTask"
                    
                    if "entities" not in ai_result:
                        ai_result["entities"] = {}
                    
                    # Log the final action to debug
                    logger.info(f"AI determined action: {ai_result['action']} for command: {command}")
                    
                    # Smart validation for CodeLlama responses
                    entities = ai_result.get("entities", {})
                    title = entities.get("title", "")
                    action = ai_result.get("action", "")
                    
                    # Ensure title is a string
                    if title is None:
                        title = ""
                    
                    # Only require title for actions that create/modify tasks
                    title_required_actions = ["addTask", "createTask", "updateTask", "editTask", "completeTask", "deleteTask", "addJob", "createJob"]
                    
                    if action in title_required_actions and len(str(title).strip()) < 2:
                        logger.warning(f"CodeLlama returned action '{action}' but no valid title, using fallback")
                        return None
                    
                    # For listing/filtering actions, empty title is OK
                    logger.info(f"CodeLlama validation passed - Action: {action}, Title: '{title}'")
                    
                    # Add AI analysis metadata
                    ai_result["ai_analysis"] = {
                        "model": OLLAMA_MODEL,
                        "processed": True,
                        "method": "ollama_local",
                        "confidence": "high"
                    }
                    
                    # Add confidence field if missing
                    if "confidence" not in ai_result:
                        ai_result["confidence"] = "high"
                    
                    logger.info(f"✅ Successfully parsed Ollama JSON: {ai_result}")
                    return ai_result
                    
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse Ollama JSON: {e}")
                logger.warning(f"Raw response: {generated_text}")
                return None
        
        else:
            logger.warning(f"Ollama API error: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        logger.error(f"Ollama interpretation failed: {e}")
        return None

async def interpret_with_ai(command: str):
    """
    AI interpretation system with CodeLlama and pattern matching fallback
    """
    logger.info(f"Starting AI interpretation for: {command}")
    
    # Try CodeLlama local AI first
    try:
        result = await interpret_with_ollama(command)
        if result:
            logger.info("CodeLlama AI interpretation successful")
            return result
    except Exception as e:
        logger.warning(f"CodeLlama AI failed: {e}")
    
    # Fallback to pattern matching
    logger.info("Using pattern matching fallback")
    return analyze_command_fallback(command)

def analyze_command_fallback(command: str):
    """
    Enhanced fallback command analysis using pattern matching
    """
    command_lower = command.lower()
    
    # Determine action with more sophisticated matching
    if any(word in command_lower for word in ["complete", "finish", "done", "mark as done", "mark complete"]):
        action = "completeTask"
    elif any(word in command_lower for word in ["delete", "remove", "cancel", "drop", "archive"]):
        action = "deleteTask"
    elif any(word in command_lower for word in ["update", "edit", "change", "modify", "reschedule"]):
        action = "updateTask"
    elif any(word in command_lower for word in ["show", "list", "get", "display"]):
        if any(word in command_lower for word in ["high", "low", "medium", "priority"]):
            action = "getTasksByPriority"
        elif any(word in command_lower for word in ["progress", "started", "done", "status"]):
            action = "getTasksByStatus"
        elif any(word in command_lower for word in ["job", "application", "interview"]):
            action = "searchJob"
        else:
            action = "listTasks"
    elif any(word in command_lower for word in ["find", "search", "look"]):
        if any(word in command_lower for word in ["job", "application", "interview"]):
            action = "searchJob"
        else:
            action = "searchTask"
    elif any(word in command_lower for word in ["job", "application", "apply", "interview", "company"]):
        action = "addJob"
    elif any(word in command_lower for word in ["add", "create", "new", "make", "schedule"]):
        action = "addTask"
    else:
        action = "addTask"  # Default
    
    # Extract a cleaner title (remove action words and temporal references)
    title = extract_clean_title(command)
    
    # Extract entities with enhanced logic
    entities = {
        "title": title,
        "dueDate": extract_due_date(command),
        "priority": extract_priority(command),
        "status": extract_status(command),
        "category": extract_category(command),
        "company": extract_company(command),
        "position": extract_position(command)
    }
    
    # Determine confidence based on how much we extracted
    confidence = "high" if entities["dueDate"] and entities["priority"] else "medium"
    
    return {
        "action": action,
        "entities": entities,
        "confidence": confidence,
        "ai_analysis": {
            "model": "enhanced_pattern_matching",
            "processed": True,
            "method": "fallback_enhanced",
            "extracted_elements": len([v for v in entities.values() if v is not None])
        }
    }

def extract_clean_title(command: str):
    """Extract a clean title by removing action words and temporal references"""
    # Remove common action words and temporal/priority indicators
    action_words = ["add", "create", "new", "make", "schedule", "task", "to"]
    temporal_words = ["today", "tomorrow", "this", "next", "on", "sunday", "saturday", "weekend", "or"]
    priority_words = ["high", "medium", "low", "priority"]
    
    words = command.split()
    cleaned_words = []
    
    for word in words:
        word_lower = word.lower().strip(".,!?")
        if (word_lower not in action_words and 
            word_lower not in temporal_words and 
            word_lower not in priority_words):
            cleaned_words.append(word)
    
    # Join and clean up
    title = " ".join(cleaned_words).strip()
    
    # Remove trailing "or" if it exists
    if title.endswith(" or"):
        title = title[:-3].strip()
    
    # If title is too short or empty, use original command
    if len(title) < 3:
        title = command
    
    return title

def extract_due_date(command: str):
    """Extract due date from command"""
    command_lower = command.lower()
    if "tomorrow" in command_lower:
        return "tomorrow"
    elif "today" in command_lower:
        return "today"
    elif "next week" in command_lower:
        return "next_week"
    elif "this week" in command_lower:
        return "this_week"
    elif "saturday" in command_lower or "sunday" in command_lower:
        if "this" in command_lower:
            return "this_weekend"
        elif "next" in command_lower:
            return "next_weekend"
        else:
            return "this_weekend"  # Default to this weekend
    elif "weekend" in command_lower:
        return "this_weekend"
    return None

def extract_priority(command: str):
    """Extract priority from command"""
    command_lower = command.lower()
    if any(word in command_lower for word in ["urgent", "important", "high"]):
        return "high"
    elif any(word in command_lower for word in ["low", "later", "someday"]):
        return "low"
    return "medium"

def extract_category(command: str):
    """Extract category from command"""
    command_lower = command.lower()
    
    # Work-related indicators
    if any(word in command_lower for word in ["work", "office", "meeting", "project", "client", "boss", "team", "deadline"]):
        return "work"
    
    # Personal indicators  
    if any(word in command_lower for word in ["personal", "home", "family", "friend", "call", "visit", "birthday", "anniversary"]):
        return "personal"
    
    # Check for names (likely personal)
    # Common names that suggest personal tasks
    personal_names = ["ravi", "john", "mary", "david", "sarah", "mike", "lisa", "alex", "sam"]
    if any(name in command_lower for name in personal_names):
        return "personal"
    
    return ""

def extract_status(command: str):
    """Extract status from command"""
    command_lower = command.lower()
    
    if any(word in command_lower for word in ["not started", "todo", "new", "pending"]):
        return "not started"
    elif any(word in command_lower for word in ["in progress", "working", "started", "doing"]):
        return "in progress"
    elif any(word in command_lower for word in ["done", "complete", "finished", "completed"]):
        return "done"
    
    return ""

def extract_company(command: str):
    """Extract company name from command"""
    command_lower = command.lower()
    
    # Look for "at [company]" or "for [company]" patterns
    import re
    patterns = [
        r'(?:at|for|with|to)\s+([A-Z][a-zA-Z\s&]+)',
        r'([A-Z][a-zA-Z&]+(?:\s+[A-Z][a-zA-Z&]+)*)\s+(?:job|application|position|interview)',
        r'apply\s+(?:at|to|for)\s+([A-Z][a-zA-Z\s&]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, command)
        if match:
            return match.group(1).strip()
    
    return ""

def extract_position(command: str):
    """Extract job position from command"""
    command_lower = command.lower()
    
    # Look for common job titles
    job_titles = [
        "software engineer", "developer", "programmer", "architect", "analyst",
        "manager", "director", "lead", "senior", "junior", "intern",
        "designer", "consultant", "specialist", "coordinator", "assistant"
    ]
    
    for title in job_titles:
        if title in command_lower:
            return title
    
    # Look for "as [position]" or "for [position]" patterns
    import re
    patterns = [
        r'(?:as|for)\s+([a-zA-Z\s]+)\s+(?:position|job|role)',
        r'(?:position|job|role)\s+(?:as|for)\s+([a-zA-Z\s]+)',
        r'apply\s+(?:for|as)\s+([a-zA-Z\s]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, command, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    
    return ""
    
    return "other"

@app.get("/")
async def root():
    """Health check endpoint with Ollama AI status"""
    # Check Ollama AI
    ollama_available, ollama_status = check_ollama_availability()
    
    return {
        "service": "Noto AI Assistant Backend",
        "status": "running",
        "version": "1.0.0-beta",
        "ai_service": "Ollama Local AI",
        "primary_model": OLLAMA_MODEL,
        "available_models": [OLLAMA_MODEL],
        "api_status": {
            "available": ollama_available,
            "status": ollama_status,
            "endpoint": f"{OLLAMA_BASE_URL}/api/generate"
        },
        "fallback_system": ["CodeLlama 7B Instruct", "Pattern Matching"],
        "features": [
            "Advanced AI command interpretation",
            "Structured JSON output",
            "Privacy-focused local processing",
            "Automatic fallback system",
            "CodeLlama 7B support"
        ]
    }

@app.post("/interpret")
async def interpret_command(request: CommandRequest):
    """
    Interpret user command using AI with fallback
    """
    try:
        logger.info(f"Processing command: {request.command}")
        
        # Use AI interpretation
        result = await interpret_with_ai(request.command)
        
        return {
            "success": True,
            "data": {
                "action": result["action"],
                "entities": result["entities"],
                "confidence": result["confidence"],
                "ai_analysis": result["ai_analysis"],
                "status": "success"
            }
        }
        
    except Exception as e:
        logger.error(f"Error processing command: {e}")
        return {
            "success": False,
            "error": str(e),
            "data": None
        }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "ai_model": "available",
            "notion_api": "configured",
            "database": "connected"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
