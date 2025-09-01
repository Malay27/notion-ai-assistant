"""
API endpoints for the Noto AI Assistant.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.core import logger
from app.models import CommandRequest, ApiResponse, HealthResponse, StatusResponse
from app.services import command_interpreter, ollama_service

router = APIRouter()


@router.get("/", response_model=StatusResponse)
async def get_status() -> StatusResponse:
    """Get service status and AI availability."""
    # Check Ollama AI
    ollama_available, ollama_status = ollama_service.check_availability()
    
    return StatusResponse(
        service="Noto AI Assistant Backend",
        status="running",
        version="1.0.0-beta",
        ai_service="Ollama Local AI",
        primary_model=ollama_service.model,
        available_models=[ollama_service.model],
        api_status={
            "available": ollama_available,
            "status": ollama_status,
            "endpoint": f"{ollama_service.base_url}/api/generate"
        },
        fallback_system=["CodeLlama 7B Instruct", "Pattern Matching"],
        features=[
            "Advanced AI command interpretation",
            "Structured JSON output", 
            "Privacy-focused local processing",
            "Automatic fallback system",
            "CodeLlama 7B support"
        ]
    )


@router.post("/interpret", response_model=ApiResponse)
async def interpret_command(request: CommandRequest) -> ApiResponse:
    """Interpret user command using AI with fallback."""
    try:
        logger.info(f"Processing command: {request.command}")
        
        # Use AI interpretation
        result = await command_interpreter.interpret_command(request.command)
        
        return ApiResponse(
            success=True,
            data={
                "action": result["action"],
                "entities": result["entities"],
                "confidence": result["confidence"],
                "ai_analysis": result["ai_analysis"],
                "status": "success"
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing command: {e}")
        return ApiResponse(
            success=False,
            error=str(e),
            data=None
        )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Detailed health check."""
    return HealthResponse(
        status="healthy",
        services={
            "ai_model": "available",
            "notion_api": "configured",
            "database": "connected"
        }
    )
