from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.db import models
from app.deps import get_db, require_admin
from app.schemas import UserCreate, UserOut, UserUpdate


router = APIRouter()


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).order_by(models.User.id.asc()).all()


@router.post("/users", response_model=UserOut, dependencies=[Depends(require_admin)])
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    exists = db.query(models.User).filter(models.User.username == data.username).first()
    if exists:
        raise HTTPException(status_code=400, detail="Username already exists")
    if data.role not in ("admin", "user"):
        raise HTTPException(status_code=400, detail="Role must be admin or user")

    user = models.User(
        username=data.username,
        password_hash=hash_password(data.password),
        role=data.role,
        enabled=data.enabled,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut, dependencies=[Depends(require_admin)])
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role is not None:
        if data.role not in ("admin", "user"):
            raise HTTPException(status_code=400, detail="Role must be admin or user")
        user.role = data.role
    if data.enabled is not None:
        user.enabled = data.enabled
    if data.password:
        user.password_hash = hash_password(data.password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", dependencies=[Depends(require_admin)])
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"status": "ok"}
