"""CUBE Backend — High-performance entry point.
"""

import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from cube.api.routes import router as cube_router
from cube.core.weil import connector

app = FastAPI(title="CUBE Backend", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cube_router)

@app.on_event("startup")
async def startup():
    await connector.initialize()
    print("CUBE Backend Started on http://0.0.0.0:8010")

@app.on_event("shutdown")
async def shutdown():
    print("CUBE Backend Shutting Down")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8010)
