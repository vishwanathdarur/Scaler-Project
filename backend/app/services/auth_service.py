from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import SignupIn, LoginIn
from app.utils.security import hash_password, verify_password, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def signup(self, data: SignupIn):
        existing = self.db.query(User).filter(User.email == data.email).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        token = create_access_token({"sub": str(user.id)})
        return user, token

    def login(self, data: LoginIn):
        user = self.db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        token = create_access_token({"sub": str(user.id)})
        return user, token
