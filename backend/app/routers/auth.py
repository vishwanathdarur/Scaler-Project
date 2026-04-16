from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.deps import get_db, get_current_user
from app.schemas.auth import SignupIn, LoginIn
from app.schemas.common import UserOut, TokenOut
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=TokenOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    _, token = AuthService(db).signup(payload)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    _, token = AuthService(db).login(payload)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
