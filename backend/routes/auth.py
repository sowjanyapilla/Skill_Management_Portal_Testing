from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os
from urllib.parse import urlencode
import json
from database import get_db
from models.user import Employee
from schemas.user import EmployeeAuthenticated
from oauth_setup import oauth  # your initialized OAuth client

router = APIRouter(prefix="/auth", tags=["authentication"])

# Env variables
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
FRONTEND_URL = os.getenv("FRONTEND_URL")
BACKEND_URL = os.getenv("BACKEND_URL")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google-login")


def create_access_token(data: dict):
    """Helper to create JWT access tokens."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -------------------- Current User --------------------
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    result = await db.execute(select(Employee).where(Employee.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Correct: validate ORM instance against Pydantic schema
    return EmployeeAuthenticated.model_validate(user)


# -------------------- Google OAuth --------------------
@router.get("/google-login")
async def google_login(request: Request):
    redirect_uri = f"{BACKEND_URL}/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        # Get token from Google
        token = await oauth.google.authorize_access_token(request)
        user_info = await oauth.google.userinfo(token=token)
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email found in token")

        # Fetch user from DB
        result = await db.execute(select(Employee).where(Employee.email == email))
        user = result.scalar_one_or_none()

        if not user:
            error_query = urlencode({
                "error": "unauthorized",
                "message": "You are not yet registered. Contact admin."
            })
            redirect_url = f"{FRONTEND_URL}/oauth-callback?{error_query}"
            return RedirectResponse(url=redirect_url)

        # Create JWT token (using real user data, not class attr)
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {
            "sub": user.email,
            "employee_id": user.emp_id,
            "exp": expire,
        }
        jwt_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

        # Map user to dict (frontend will use this)
        user_obj = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "employee_id": user.emp_id,
            "is_approver": user.is_approver,
            "approver_id": user.approver_id,
            "designation": user.designation,
            "capability": user.capability,
            "is_active": user.is_active,
            "is_available": user.is_available
        }

        # Build query string for frontend
        query = urlencode({
            "token": jwt_token,
            "user": json.dumps(user_obj),
            "google_access_token": token.get("access_token", "")
        })

        redirect_url = f"{FRONTEND_URL}/oauth-callback?{query}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        print("Error in callback:", e)
        raise HTTPException(status_code=500, detail="OAuth callback failed")
