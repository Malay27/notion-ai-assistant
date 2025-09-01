"""
Text extraction utilities for parsing natural language commands.
"""

import re
from typing import Optional


class TextExtractors:
    """Utility class for extracting information from natural language text."""
    
    def extract_clean_title(self, command: str) -> str:
        """Extract a clean title by removing action words and temporal references."""
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
    
    def extract_due_date(self, command: str) -> Optional[str]:
        """Extract due date from command."""
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
    
    def extract_priority(self, command: str) -> str:
        """Extract priority from command."""
        command_lower = command.lower()
        if any(word in command_lower for word in ["urgent", "important", "high"]):
            return "high"
        elif any(word in command_lower for word in ["low", "later", "someday"]):
            return "low"
        return "medium"
    
    def extract_category(self, command: str) -> str:
        """Extract category from command."""
        command_lower = command.lower()
        
        # Work-related indicators
        if any(word in command_lower for word in ["work", "office", "meeting", "project", "client", "boss", "team", "deadline"]):
            return "work"
        
        # Personal indicators  
        if any(word in command_lower for word in ["personal", "home", "family", "friend", "call", "visit", "birthday", "anniversary"]):
            return "personal"
        
        # Check for names (likely personal)
        personal_names = ["ravi", "john", "mary", "david", "sarah", "mike", "lisa", "alex", "sam"]
        if any(name in command_lower for name in personal_names):
            return "personal"
        
        return "other"
    
    def extract_status(self, command: str) -> str:
        """Extract status from command."""
        command_lower = command.lower()
        
        if any(word in command_lower for word in ["not started", "todo", "new", "pending"]):
            return "not started"
        elif any(word in command_lower for word in ["in progress", "working", "started", "doing"]):
            return "in progress"
        elif any(word in command_lower for word in ["done", "complete", "finished", "completed"]):
            return "done"
        
        return "not started"
    
    def extract_company(self, command: str) -> Optional[str]:
        """Extract company name from command."""
        # Look for "at [company]" or "for [company]" patterns
        patterns = [
            r'(?:at|for|with|to)\s+([A-Z][a-zA-Z\s&]+)',
            r'([A-Z][a-zA-Z&]+(?:\s+[A-Z][a-zA-Z&]+)*)\s+(?:job|application|position|interview)',
            r'apply\s+(?:at|to|for)\s+([A-Z][a-zA-Z\s&]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, command)
            if match:
                return match.group(1).strip()
        
        return None
    
    def extract_position(self, command: str) -> Optional[str]:
        """Extract job position from command."""
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
        patterns = [
            r'(?:as|for)\s+([a-zA-Z\s]+)\s+(?:position|job|role)',
            r'(?:position|job|role)\s+(?:as|for)\s+([a-zA-Z\s]+)',
            r'apply\s+(?:for|as)\s+([a-zA-Z\s]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
