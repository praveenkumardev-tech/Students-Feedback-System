from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from typing import List, Optional
from datetime import timedelta

from models import (
    User, UserCreate, UserLogin, Token,
    FeedbackForm, FeedbackFormCreate, FeedbackFormUpdate, FeedbackFormResponse,
    StudentFeedback, StudentFeedbackCreate, FeedbackSummary,
    UserRole
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, get_current_admin_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from database import database

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create the main app
app = FastAPI(title="Teacher Feedback Collection System API")

# Create API router
api_router = APIRouter(prefix="/api")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    await database.connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await database.close_mongo_connection()

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await database.database.users.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role
    )
    
    await database.database.users.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        role=user.role,
        user_id=user.id
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    # Find user
    user_doc = await database.database.users.find_one({"username": user_data.username})
    if not user_doc or not verify_password(user_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_doc["id"], "role": user_doc["role"]},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        role=user_doc["role"],
        user_id=user_doc["id"]
    )

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    user_doc = await database.database.users.find_one({"id": current_user["user_id"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user_doc["id"],
        "username": user_doc["username"],
        "email": user_doc["email"],
        "role": user_doc["role"]
    }

# Feedback Form Routes (Admin Only)
@api_router.post("/forms", response_model=FeedbackFormResponse)
async def create_feedback_form(
    form_data: FeedbackFormCreate,
    current_user: dict = Depends(get_current_admin_user)
):
    # Create feedback form
    form = FeedbackForm(
        title=form_data.title,
        year=form_data.year,
        section=form_data.section,
        department=form_data.department,
        subjects=form_data.subjects,
        evaluation_criteria=form_data.evaluation_criteria,
        created_by=current_user["user_id"]
    )
    
    # Generate shareable link
    base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    form.shareable_link = f"{base_url}/#/student/{form.id}"
    
    await database.database.feedback_forms.insert_one(form.dict())
    
    return FeedbackFormResponse(**form.dict(), response_count=0)

@api_router.get("/forms", response_model=List[FeedbackFormResponse])
async def get_feedback_forms(current_user: dict = Depends(get_current_admin_user)):
    forms_cursor = database.database.feedback_forms.find(
        {"created_by": current_user["user_id"], "is_active": True}
    )
    forms = []
    
    async for form_doc in forms_cursor:
        # Count responses for each form
        response_count = await database.database.student_feedbacks.count_documents(
            {"form_id": form_doc["id"]}
        )
        
        form_response = FeedbackFormResponse(**form_doc, response_count=response_count)
        forms.append(form_response)
    
    return forms

@api_router.get("/forms/{form_id}", response_model=FeedbackFormResponse)
async def get_feedback_form(form_id: str):
    """Get feedback form by ID - accessible to both admin and students via shareable link"""
    form_doc = await database.database.feedback_forms.find_one(
        {"id": form_id, "is_active": True}
    )
    
    if not form_doc:
        raise HTTPException(status_code=404, detail="Feedback form not found")
    
    # Count responses
    response_count = await database.database.student_feedbacks.count_documents(
        {"form_id": form_id}
    )
    
    return FeedbackFormResponse(**form_doc, response_count=response_count)

@api_router.put("/forms/{form_id}", response_model=FeedbackFormResponse)
async def update_feedback_form(
    form_id: str,
    form_update: FeedbackFormUpdate,
    current_user: dict = Depends(get_current_admin_user)
):
    # Check if form exists and belongs to current user
    existing_form = await database.database.feedback_forms.find_one(
        {"id": form_id, "created_by": current_user["user_id"]}
    )
    
    if not existing_form:
        raise HTTPException(status_code=404, detail="Feedback form not found")
    
    # Update form
    update_data = {k: v for k, v in form_update.dict().items() if v is not None}
    
    await database.database.feedback_forms.update_one(
        {"id": form_id},
        {"$set": update_data}
    )
    
    # Get updated form
    updated_form = await database.database.feedback_forms.find_one({"id": form_id})
    response_count = await database.database.student_feedbacks.count_documents(
        {"form_id": form_id}
    )
    
    return FeedbackFormResponse(**updated_form, response_count=response_count)

@api_router.delete("/forms/{form_id}")
async def delete_feedback_form(
    form_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    # Check if form exists and belongs to current user
    existing_form = await database.database.feedback_forms.find_one(
        {"id": form_id, "created_by": current_user["user_id"]}
    )
    
    if not existing_form:
        raise HTTPException(status_code=404, detail="Feedback form not found")
    
    # Soft delete - mark as inactive
    await database.database.feedback_forms.update_one(
        {"id": form_id},
        {"$set": {"is_active": False}}
    )
    
    return {"message": "Feedback form deleted successfully"}

# Student Feedback Routes
@api_router.post("/feedback", response_model=StudentFeedback)
async def submit_feedback(feedback_data: StudentFeedbackCreate):
    # Check if form exists and is active
    form_doc = await database.database.feedback_forms.find_one(
        {"id": feedback_data.form_id, "is_active": True}
    )
    
    if not form_doc:
        raise HTTPException(status_code=404, detail="Feedback form not found")
    
    # Check if student has already submitted feedback for this form
    existing_feedback = await database.database.student_feedbacks.find_one({
        "form_id": feedback_data.form_id,
        "student_id": feedback_data.student_id
    })
    
    if existing_feedback:
        raise HTTPException(
            status_code=400,
            detail="You have already submitted feedback for this form"
        )
    
    # Calculate averages for each subject
    averages = {}
    for subject, ratings in feedback_data.ratings.items():
        if ratings:
            averages[subject] = sum(ratings.values()) / len(ratings)
    
    # Create feedback
    feedback = StudentFeedback(
        form_id=feedback_data.form_id,
        student_id=feedback_data.student_id,
        student_name=feedback_data.student_name,
        ratings=feedback_data.ratings,
        comments=feedback_data.comments,
        averages=averages
    )
    
    await database.database.student_feedbacks.insert_one(feedback.dict())
    
    return feedback

@api_router.get("/forms/{form_id}/feedback", response_model=FeedbackSummary)
async def get_form_feedback(
    form_id: str,
    current_user: dict = Depends(get_current_admin_user)
):
    # Check if form exists and belongs to current user
    form_doc = await database.database.feedback_forms.find_one(
        {"id": form_id, "created_by": current_user["user_id"]}
    )
    
    if not form_doc:
        raise HTTPException(status_code=404, detail="Feedback form not found")
    
    # Get all feedbacks for this form
    feedbacks_cursor = database.database.student_feedbacks.find({"form_id": form_id})
    feedbacks = []
    subject_ratings = {}
    
    async for feedback_doc in feedbacks_cursor:
        feedback = StudentFeedback(**feedback_doc)
        feedbacks.append(feedback)
        
        # Collect ratings for average calculation
        for subject, avg_rating in feedback.averages.items():
            if subject not in subject_ratings:
                subject_ratings[subject] = []
            subject_ratings[subject].append(avg_rating)
    
    # Calculate average ratings per subject
    average_ratings_per_subject = {}
    for subject, ratings in subject_ratings.items():
        average_ratings_per_subject[subject] = sum(ratings) / len(ratings) if ratings else 0
    
    return FeedbackSummary(
        form_id=form_id,
        form_title=form_doc["title"],
        year=form_doc["year"],
        section=form_doc["section"],
        department=form_doc["department"],
        total_responses=len(feedbacks),
        average_ratings_per_subject=average_ratings_per_subject,
        feedbacks=feedbacks
    )

@api_router.get("/")
async def root():
    return {"message": "Teacher Feedback Collection System API"}

# Include the router
app.include_router(api_router)