"""
backend/main.py
Root entry point for the FastAPI backend that redirects to the pdp package.
"""
import uvicorn
from pdp.main import app

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
