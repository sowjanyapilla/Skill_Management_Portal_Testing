from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os

from database import engine, Base
from routes import auth_router, users_router, skills_router, approvals_router

# Create database tables
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Skill Management API",
    description="Backend API for Skill Management System",
    version="1.0.0"
)

# Add SessionMiddleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "super-secret-session-key"),
    https_only=False  # True in production
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(skills_router)
app.include_router(users_router)
app.include_router(approvals_router)

@app.get("/")
async def root():
    return {"message": "Skill Management API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is operational"}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )