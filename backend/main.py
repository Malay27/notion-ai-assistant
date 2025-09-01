"""
Noto AI Assistant - Backend Entry Point
Clean, refactored backend following Python best practices.

@author Malay
@version 1.0.0-beta
"""

import uvicorn
from app import app

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
