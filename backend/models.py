from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import uuid
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    STUDENT = "student"

# Authentication Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    hashed_password: str
    role: UserRole
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole = UserRole.ADMIN

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str

# Feedback Form Models
class FeedbackForm(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    year: str
    section: str
    department: str
    subjects: List[str]
    evaluation_criteria: List[str]
    created_by: str  # Admin user ID
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    shareable_link: str = ""

class FeedbackFormCreate(BaseModel):
    title: str
    year: str
    section: str
    department: str
    subjects: List[str]
    evaluation_criteria: List[str]

class FeedbackFormUpdate(BaseModel):
    title: Optional[str] = None
    year: Optional[str] = None
    section: Optional[str] = None
    department: Optional[str] = None
    subjects: Optional[List[str]] = None
    evaluation_criteria: Optional[List[str]] = None
    is_active: Optional[bool] = None

# Student Feedback Models
class StudentFeedback(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    student_id: str
    student_name: Optional[str] = None
    ratings: Dict[str, Dict[str, int]]  # {subject: {criteria: rating}}
    comments: Optional[str] = None
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    averages: Dict[str, float] = {}

class StudentFeedbackCreate(BaseModel):
    form_id: str
    student_id: str
    student_name: Optional[str] = None
    ratings: Dict[str, Dict[str, int]]
    comments: Optional[str] = None

# Response Models
class FeedbackFormResponse(BaseModel):
    id: str
    title: str
    year: str
    section: str
    department: str
    subjects: List[str]
    evaluation_criteria: List[str]
    created_by: str
    created_at: datetime
    is_active: bool
    shareable_link: str
    response_count: int = 0

class FeedbackSummary(BaseModel):
    form_id: str
    form_title: str
    year: str
    section: str
    department: str
    total_responses: int
    average_ratings_per_subject: Dict[str, float]
    feedbacks: List[StudentFeedback]