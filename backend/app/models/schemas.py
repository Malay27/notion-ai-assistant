"""
Pydantic models for request/response validation.
"""

from typing import Dict, Optional, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class CommandRequest(BaseModel):
    """Request model for command interpretation."""
    command: str = Field(..., min_length=1, description="User command to interpret")
    user_id: str = Field(default="default", description="User identifier")


class TaskEntities(BaseModel):
    """Task-related entities extracted from command."""
    title: Optional[str] = None
    due_date: Optional[str] = Field(None, alias="dueDate")
    priority: Optional[Literal["low", "medium", "high"]] = None
    status: Optional[str] = None
    category: Optional[str] = None


class JobEntities(BaseModel):
    """Job application-related entities extracted from command."""
    title: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    application_link: Optional[str] = Field(None, alias="applicationLink")
    resume_used: Optional[str] = Field(None, alias="resumeUsed")
    notes: Optional[str] = None
    next_step: Optional[str] = Field(None, alias="nextStep")


class AIAnalysis(BaseModel):
    """AI analysis metadata."""
    model: str
    method: str
    processed: bool = True
    confidence: Optional[str] = None
    processing_time: Optional[float] = Field(None, alias="processing_time")
    extracted_elements: Optional[int] = Field(None, alias="extracted_elements")


class CommandResponse(BaseModel):
    """Response model for command interpretation."""
    action: str
    entities: Dict[str, Any]
    confidence: str
    ai_analysis: AIAnalysis
    status: str = "success"


class ApiResponse(BaseModel):
    """Generic API response model."""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    services: Dict[str, str]


class StatusResponse(BaseModel):
    """Status endpoint response model."""
    service: str
    status: str
    version: str
    ai_service: str
    primary_model: str
    available_models: list[str]
    api_status: Dict[str, Any]
    fallback_system: list[str]
    features: list[str]
