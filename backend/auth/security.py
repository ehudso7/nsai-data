import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.exceptions import AuthenticationError, AuthorizationError

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token handling
security = HTTPBearer()

class SecurityService:
    """Handles all security-related operations"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(
        subject: Union[str, Any],
        expires_delta: Optional[timedelta] = None,
        scopes: list[str] = None
    ) -> str:
        """Create JWT access token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
            )
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "access",
            "scopes": scopes or []
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(
        subject: Union[str, Any],
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """Create JWT refresh token"""
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(
                days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
            )
        
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "type": "refresh",
            "jti": secrets.token_urlsafe(32)  # Unique token ID
        }
        
        encoded_jwt = jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            return payload
        except JWTError as e:
            raise AuthenticationError("Invalid authentication credentials")
    
    @staticmethod
    def generate_api_key() -> tuple[str, str]:
        """Generate API key and return (key, hash)"""
        # Generate a secure random API key
        key = f"sk_{secrets.token_urlsafe(32)}"
        
        # Create hash for storage
        key_hash = hashlib.sha256(
            (key + settings.API_KEY_SALT).encode()
        ).hexdigest()
        
        return key, key_hash
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash an API key for comparison"""
        return hashlib.sha256(
            (api_key + settings.API_KEY_SALT).encode()
        ).hexdigest()
    
    @staticmethod
    def validate_password_strength(password: str) -> bool:
        """Validate password meets security requirements"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        if not (has_upper and has_lower and has_digit):
            raise ValueError(
                "Password must contain uppercase, lowercase, and numeric characters"
            )
        
        return True
    
    @staticmethod
    def generate_verification_token() -> str:
        """Generate email verification token"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def generate_password_reset_token(email: str) -> str:
        """Generate password reset token"""
        expires = datetime.utcnow() + timedelta(hours=24)
        to_encode = {
            "exp": expires,
            "sub": email,
            "type": "password_reset"
        }
        
        return jwt.encode(
            to_encode,
            settings.SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
    
    @staticmethod
    def verify_password_reset_token(token: str) -> Optional[str]:
        """Verify password reset token and return email"""
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            if payload.get("type") != "password_reset":
                return None
                
            email = payload.get("sub")
            return email
            
        except JWTError:
            return None

# Dependency for getting current user from JWT token
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(lambda: None)  # Replace with actual DB dependency
):
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    try:
        payload = SecurityService.decode_token(token)
        
        if payload.get("type") != "access":
            raise AuthenticationError("Invalid token type")
        
        user_id = payload.get("sub")
        if user_id is None:
            raise AuthenticationError("Invalid authentication credentials")
        
        # TODO: Fetch user from database
        # user = db.query(User).filter(User.id == user_id).first()
        # if user is None:
        #     raise AuthenticationError("User not found")
        
        # return user
        return {"user_id": user_id, "scopes": payload.get("scopes", [])}
        
    except JWTError:
        raise AuthenticationError("Invalid authentication credentials")

# Dependency for requiring specific scopes
def require_scopes(*required_scopes: str):
    """Require specific scopes for endpoint access"""
    async def scope_checker(
        current_user = Depends(get_current_user)
    ):
        user_scopes = set(current_user.get("scopes", []))
        required = set(required_scopes)
        
        if not required.issubset(user_scopes):
            raise AuthorizationError(
                f"Not enough permissions. Required: {required_scopes}"
            )
        
        return current_user
    
    return scope_checker

# Dependency for API key authentication
async def get_api_key_user(
    api_key: str = Depends(lambda: None),  # From header
    db: Session = Depends(lambda: None)  # Replace with actual DB dependency
):
    """Authenticate user via API key"""
    if not api_key or not api_key.startswith("sk_"):
        raise AuthenticationError("Invalid API key format")
    
    key_hash = SecurityService.hash_api_key(api_key)
    
    # TODO: Fetch API key from database
    # api_key_obj = db.query(APIKey).filter(
    #     APIKey.key_hash == key_hash,
    #     APIKey.is_active == True
    # ).first()
    
    # if not api_key_obj:
    #     raise AuthenticationError("Invalid API key")
    
    # # Update last used
    # api_key_obj.last_used = datetime.utcnow()
    # db.commit()
    
    # return api_key_obj.user
    
    return {"user_id": "api_key_user", "scopes": ["api"]}