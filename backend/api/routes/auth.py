from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import User, AuditLog
from db.schemas import SignupRequest, LoginRequest, TokenResponse, UserResponse
from core.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /api/auth/signup
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, request: Request, db: Session = Depends(get_db)):
    # Check for duplicate email
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        action="signup",
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled.",
        )

    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        action="login",
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(request: Request, db: Session = Depends(get_db),
           current_user: User = Depends(get_current_user)):
    # JWT is stateless — logout is handled client-side by discarding the token.
    # We log the event server-side for audit purposes.
    db.add(AuditLog(
        user_id=current_user.id,
        action="logout",
        ip_address=request.client.host if request.client else None,
    ))
    db.commit()
    return {"detail": "Logged out successfully."}


# ---------------------------------------------------------------------------
# GET /api/auth/me  — returns the current user's profile
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user