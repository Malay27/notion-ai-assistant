"""
Command interpretation service with AI and fallback logic.
"""

import json
import re
from typing import Dict, Any, Optional

from app.core import logger
from app.services.ollama import ollama_service
from app.utils.text_extractors import TextExtractors


class CommandInterpreterService:
    """Service for interpreting natural language commands."""
    
    def __init__(self):
        self.text_extractors = TextExtractors()
    
    async def interpret_command(self, command: str) -> Dict[str, Any]:
        """
        Interpret user command using AI with fallback to pattern matching.
        
        Args:
            command: Natural language command from user
            
        Returns:
            Dictionary with action, entities, confidence, and ai_analysis
        """
        logger.info(f"Starting AI interpretation for: {command}")
        
        # Try Ollama AI first
        try:
            result = await self._interpret_with_ollama(command)
            if result:
                logger.info("Ollama AI interpretation successful")
                return result
        except Exception as e:
            logger.warning(f"Ollama AI failed: {e}")
        
        # Fallback to pattern matching
        logger.info("Using pattern matching fallback")
        return self._interpret_with_fallback(command)
    
    async def _interpret_with_ollama(self, command: str) -> Optional[Dict[str, Any]]:
        """Use Ollama local AI for command interpretation."""
        logger.info(f"Interpreting command with Ollama: {command}")
        
        # Check if Ollama is available
        ollama_available, status = ollama_service.check_availability()
        if not ollama_available:
            logger.warning(f"Ollama not available: {status}")
            return None
        
        # Create prompt and generate completion
        prompt = ollama_service.create_command_prompt(command)
        generated_text = ollama_service.generate_completion(prompt)
        
        if not generated_text:
            return None
        
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
                ai_result = self._validate_ai_result(ai_result, command)
                
                # Add AI analysis metadata
                ai_result["ai_analysis"] = {
                    "model": ollama_service.model,
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
    
    def _validate_ai_result(self, ai_result: Dict[str, Any], command: str) -> Dict[str, Any]:
        """Validate and fix AI result if needed."""
        # Ensure required fields
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
        
        # Smart validation for AI responses
        entities = ai_result.get("entities", {})
        title = entities.get("title", "")
        action = ai_result.get("action", "")
        
        # Ensure title is a string
        if title is None:
            title = ""
        
        # Only require title for actions that create/modify tasks
        title_required_actions = [
            "addTask", "createTask", "updateTask", "editTask", 
            "completeTask", "deleteTask", "addJob", "createJob"
        ]
        
        if action in title_required_actions and len(str(title).strip()) < 2:
            logger.warning(f"AI returned action '{action}' but no valid title, using fallback")
            return None
        
        logger.info(f"AI validation passed - Action: {action}, Title: '{title}'")
        return ai_result
    
    def _interpret_with_fallback(self, command: str) -> Dict[str, Any]:
        """Enhanced fallback command analysis using pattern matching."""
        command_lower = command.lower()
        
        # Determine action with sophisticated matching
        action = self._determine_action(command_lower)
        
        # Extract entities
        entities = {
            "title": self.text_extractors.extract_clean_title(command),
            "dueDate": self.text_extractors.extract_due_date(command),
            "priority": self.text_extractors.extract_priority(command),
            "status": self.text_extractors.extract_status(command),
            "category": self.text_extractors.extract_category(command),
            "company": self.text_extractors.extract_company(command),
            "position": self.text_extractors.extract_position(command)
        }
        
        # Determine confidence based on extraction success
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
    
    def _determine_action(self, command_lower: str) -> str:
        """Determine action from command using pattern matching."""
        if any(word in command_lower for word in ["complete", "finish", "done", "mark as done", "mark complete"]):
            return "completeTask"
        elif any(word in command_lower for word in ["delete", "remove", "cancel", "drop", "archive"]):
            return "deleteTask"
        elif any(word in command_lower for word in ["update", "edit", "change", "modify", "reschedule"]):
            return "updateTask"
        elif any(word in command_lower for word in ["show", "list", "get", "display"]):
            if any(word in command_lower for word in ["high", "low", "medium", "priority"]):
                return "getTasksByPriority"
            elif any(word in command_lower for word in ["progress", "started", "done", "status"]):
                return "getTasksByStatus"
            elif any(word in command_lower for word in ["job", "application", "interview"]):
                return "searchJob"
            else:
                return "listTasks"
        elif any(word in command_lower for word in ["find", "search", "look"]):
            if any(word in command_lower for word in ["job", "application", "interview"]):
                return "searchJob"
            else:
                return "searchTask"
        elif any(word in command_lower for word in ["job", "application", "apply", "interview", "company"]):
            return "addJob"
        elif any(word in command_lower for word in ["add", "create", "new", "make", "schedule"]):
            return "addTask"
        else:
            return "addTask"  # Default


# Global service instance
command_interpreter = CommandInterpreterService()
