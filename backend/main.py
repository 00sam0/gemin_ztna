import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime, timedelta

# Database imports
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Password hashing
from passlib.context import CryptContext

# --- Configuration ---
# Use environment variables for sensitive data
SECRET_KEY = os.getenv("SECRET_KEY", "a_default_secret_key_for_local_dev")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/ztna")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- Database Setup ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models ---
class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="employee")
    disabled = Column(Boolean, default=False)

class LogDB(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor_email = Column(String)
    action = Column(String)
    details = Column(String, nullable=True)

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Pydantic Models (for API requests/responses) ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "employee"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    disabled: bool
    class Config:
        from_attributes = True

class Log(BaseModel):
    id: int
    timestamp: datetime
    actor_email: str
    action: str
    details: Optional[str] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- FastAPI App Initialization ---
app = FastAPI()

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    # Create a default admin user if one doesn't exist
    db = SessionLocal()
    admin_user = get_user_by_email(db, "admin@example.com")
    if not admin_user:
        print("Creating default admin user: admin@example.com / password")
        hashed_password = pwd_context.hash("password")
        default_admin = UserDB(
            email="admin@example.com",
            full_name="Default Admin",
            hashed_password=hashed_password,
            role="admin"
        )
        db.add(default_admin)
        db.commit()
    db.close()


# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Utility Functions ---
def get_user_by_email(db: Session, email: str):
    return db.query(UserDB).filter(UserDB.email == email).first()

def create_log(db: Session, actor: User, action: str, details: Optional[str] = None):
    log_entry = LogDB(actor_email=actor.email, action=action, details=details)
    db.add(log_entry)
    db.commit()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- Authentication & Authorization ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_admin_role(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Admin role required."
        )
    return current_user

# --- API Endpoints ---
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = get_user_by_email(db, email=form_data.username)
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    create_log(db, user, "USER_LOGIN_SUCCESS")
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# --- Admin Endpoints ---
@app.get("/api/admin/users", response_model=List[User], dependencies=[Depends(require_admin_role)])
async def read_all_users(db: Session = Depends(get_db)):
    return db.query(UserDB).all()

@app.post("/api/admin/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_new_user(user: UserCreate, admin_user: User = Depends(require_admin_role), db: Session = Depends(get_db)):
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(user.password)
    new_user = UserDB(**user.dict(exclude={"password"}), hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    create_log(db, admin_user, "CREATE_USER", f"Created user {new_user.email}")
    return new_user

@app.delete("/api/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, admin_user: User = Depends(require_admin_role), db: Session = Depends(get_db)):
    user_to_delete = db.query(UserDB).filter(UserDB.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="User not found")
    if user_to_delete.email == admin_user.email:
        raise HTTPException(status_code=400, detail="Admin cannot delete themselves")
    
    email_of_deleted_user = user_to_delete.email
    db.delete(user_to_delete)
    db.commit()
    create_log(db, admin_user, "DELETE_USER", f"Deleted user {email_of_deleted_user}")
    return

@app.get("/api/admin/logs", response_model=List[Log], dependencies=[Depends(require_admin_role)])
async def read_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(LogDB).order_by(LogDB.timestamp.desc()).offset(skip).limit(limit).all()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# --- Static Files Mount ---
# This must come AFTER all your API routes
# It serves the React app's index.html for any path not caught by the API routes
# We only mount this in production, where the 'static' folder is created by the Dockerfile.
if os.path.exists("static"):
    app.mount("/", StaticFiles(directory="static", html=True), name="static")