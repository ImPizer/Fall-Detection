from datetime import datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.config import Settings


cfg = Settings()
# Use PBKDF2 to avoid bcrypt runtime incompatibilities on some Windows setups.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(subject: str, role: str) -> str:
    expires = datetime.utcnow() + timedelta(minutes=cfg.access_token_exp_minutes)
    to_encode = {"sub": subject, "role": role, "exp": expires}
    return jwt.encode(to_encode, cfg.secret_key, algorithm="HS256")
