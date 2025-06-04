from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from backend.auth.security import SecurityService, get_current_user
from backend.core.config import settings
from backend.core.exceptions import AuthenticationError, ValidationError

router = APIRouter(prefix="/auth", tags=["authentication"])

# Pydantic models
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str  # Can be email or username
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)
    scopes: Optional[list[str]] = None

class APIKeyResponse(BaseModel):
    id: str
    name: str
    api_key: str  # Only returned on creation
    prefix: str
    created_at: datetime
    expires_at: Optional[datetime]
    scopes: list[str]

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    user_data: UserRegister,
    # db: Session = Depends(get_db)
):
    """Register a new user account"""
    # Check if registration is enabled
    if not settings.ENABLE_SIGNUP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User registration is currently disabled"
        )
    
    try:
        # Validate password strength
        SecurityService.validate_password_strength(user_data.password)
        
        # TODO: Check if user exists
        # existing = db.query(User).filter(
        #     (User.email == user_data.email) | 
        #     (User.username == user_data.username)
        # ).first()
        
        # if existing:
        #     raise ValidationError("User with this email or username already exists")
        
        # Create user
        hashed_password = SecurityService.get_password_hash(user_data.password)
        
        # TODO: Save to database
        # user = User(
        #     email=user_data.email,
        #     username=user_data.username,
        #     hashed_password=hashed_password,
        #     full_name=user_data.full_name,
        #     is_verified=False
        # )
        # db.add(user)
        # db.commit()
        # db.refresh(user)
        
        # TODO: Send verification email
        # if settings.ENABLE_EMAIL_VERIFICATION:
        #     token = SecurityService.generate_verification_token()
        #     # Send email with token
        
        # Mock response
        return UserResponse(
            id="mock-user-id",
            email=user_data.email,
            username=user_data.username,
            full_name=user_data.full_name,
            is_active=True,
            is_verified=False,
            created_at=datetime.utcnow()
        )
        
    except ValueError as e:
        raise ValidationError(str(e))

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    # db: Session = Depends(get_db)
):
    """Login with username/email and password"""
    # TODO: Fetch user from database
    # user = db.query(User).filter(
    #     (User.email == form_data.username) | 
    #     (User.username == form_data.username)
    # ).first()
    
    # if not user or not SecurityService.verify_password(
    #     form_data.password, user.hashed_password
    # ):
    #     raise AuthenticationError("Incorrect username or password")
    
    # if not user.is_active:
    #     raise AuthenticationError("User account is disabled")
    
    # Mock authentication
    if form_data.username != "demo" or form_data.password != "demo1234":
        raise AuthenticationError("Incorrect username or password")
    
    user_id = "mock-user-id"
    
    # Generate tokens
    access_token = SecurityService.create_access_token(
        subject=user_id,
        scopes=["read", "write"]
    )
    
    refresh_token = SecurityService.create_refresh_token(subject=user_id)
    
    # TODO: Save refresh token to database
    # refresh_token_obj = RefreshToken(
    #     user_id=user.id,
    #     token_hash=hashlib.sha256(refresh_token.encode()).hexdigest(),
    #     expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS),
    #     user_agent=request.headers.get("User-Agent"),
    #     ip_address=request.client.host
    # )
    # db.add(refresh_token_obj)
    # db.commit()
    
    # Update last login
    # user.last_login = datetime.utcnow()
    # db.commit()
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    # db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    try:
        payload = SecurityService.decode_token(refresh_token)
        
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")
        
        user_id = payload.get("sub")
        
        # TODO: Verify refresh token in database
        # token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        # token_obj = db.query(RefreshToken).filter(
        #     RefreshToken.token_hash == token_hash,
        #     RefreshToken.is_active == True
        # ).first()
        
        # if not token_obj:
        #     raise AuthenticationError("Invalid refresh token")
        
        # Generate new access token
        access_token = SecurityService.create_access_token(
            subject=user_id,
            scopes=["read", "write"]
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,  # Return same refresh token
            expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
    except Exception:
        raise AuthenticationError("Invalid refresh token")

@router.post("/logout")
async def logout(
    current_user = Depends(get_current_user),
    # db: Session = Depends(get_db)
):
    """Logout and invalidate refresh tokens"""
    # TODO: Invalidate all user's refresh tokens
    # db.query(RefreshToken).filter(
    #     RefreshToken.user_id == current_user["user_id"],
    #     RefreshToken.is_active == True
    # ).update({"is_active": False, "revoked_at": datetime.utcnow()})
    # db.commit()
    
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user = Depends(get_current_user),
    # db: Session = Depends(get_db)
):
    """Get current user information"""
    # TODO: Fetch full user data
    # user = db.query(User).filter(User.id == current_user["user_id"]).first()
    
    return UserResponse(
        id=current_user["user_id"],
        email="demo@nsaidata.com",
        username="demo",
        full_name="Demo User",
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow()
    )

@router.post("/password-reset/request")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    # db: Session = Depends(get_db)
):
    """Request password reset email"""
    # TODO: Check if user exists
    # user = db.query(User).filter(User.email == reset_request.email).first()
    
    # Always return success to prevent email enumeration
    # if user:
    #     token = SecurityService.generate_password_reset_token(user.email)
    #     # TODO: Send reset email with token
    
    return {
        "message": "If an account exists with this email, you will receive password reset instructions"
    }

@router.post("/password-reset/confirm")
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    # db: Session = Depends(get_db)
):
    """Confirm password reset with token"""
    email = SecurityService.verify_password_reset_token(reset_data.token)
    
    if not email:
        raise ValidationError("Invalid or expired reset token")
    
    try:
        # Validate new password
        SecurityService.validate_password_strength(reset_data.new_password)
        
        # TODO: Update user password
        # user = db.query(User).filter(User.email == email).first()
        # if user:
        #     user.hashed_password = SecurityService.get_password_hash(reset_data.new_password)
        #     db.commit()
        
        return {"message": "Password successfully reset"}
        
    except ValueError as e:
        raise ValidationError(str(e))

@router.post("/api-keys", response_model=APIKeyResponse)
async def create_api_key(
    key_data: APIKeyCreate,
    current_user = Depends(get_current_user),
    # db: Session = Depends(get_db)
):
    """Create a new API key"""
    # Generate API key
    api_key, key_hash = SecurityService.generate_api_key()
    prefix = api_key[:8]
    
    # Calculate expiration
    expires_at = None
    if key_data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)
    
    # TODO: Save to database
    # api_key_obj = APIKey(
    #     user_id=current_user["user_id"],
    #     name=key_data.name,
    #     key_hash=key_hash,
    #     prefix=prefix,
    #     expires_at=expires_at,
    #     scopes=json.dumps(key_data.scopes or ["read"])
    # )
    # db.add(api_key_obj)
    # db.commit()
    # db.refresh(api_key_obj)
    
    return APIKeyResponse(
        id="mock-api-key-id",
        name=key_data.name,
        api_key=api_key,  # Only returned on creation
        prefix=prefix,
        created_at=datetime.utcnow(),
        expires_at=expires_at,
        scopes=key_data.scopes or ["read"]
    )

@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    current_user = Depends(get_current_user),
    # db: Session = Depends(get_db)
):
    """List user's API keys"""
    # TODO: Fetch from database
    # api_keys = db.query(APIKey).filter(
    #     APIKey.user_id == current_user["user_id"]
    # ).all()
    
    # Note: Don't return the actual API key, only metadata
    return []

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    current_user = Depends(get_current_user),
    # db: Session = Depends(get_db)
):
    """Revoke an API key"""
    # TODO: Find and deactivate key
    # api_key = db.query(APIKey).filter(
    #     APIKey.id == key_id,
    #     APIKey.user_id == current_user["user_id"]
    # ).first()
    
    # if not api_key:
    #     raise HTTPException(status_code=404, detail="API key not found")
    
    # api_key.is_active = False
    # db.commit()
    
    return {"message": "API key revoked successfully"}