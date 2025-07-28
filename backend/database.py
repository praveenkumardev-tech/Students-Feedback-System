from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

    async def connect_to_mongo(self):
        """Create database connection"""
        try:
            mongo_url = os.environ.get('MONGO_URL')
            if not mongo_url:
                raise ValueError("MONGO_URL environment variable not set")
            
            self.client = AsyncIOMotorClient(mongo_url)
            self.database = self.client[os.environ.get('DB_NAME', 'teacher_feedback')]
            logger.info("Connected to MongoDB")
            
            # Create indexes for better performance
            await self.create_indexes()
            
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            raise

    async def close_mongo_connection(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")

    async def create_indexes(self):
        """Create database indexes"""
        try:
            # Users collection indexes
            await self.database.users.create_index("username", unique=True)
            await self.database.users.create_index("email", unique=True)
            
            # Feedback forms collection indexes
            await self.database.feedback_forms.create_index("created_by")
            await self.database.feedback_forms.create_index("is_active")
            
            # Student feedbacks collection indexes
            await self.database.student_feedbacks.create_index("form_id")
            await self.database.student_feedbacks.create_index("student_id")
            await self.database.student_feedbacks.create_index([("form_id", 1), ("student_id", 1)], unique=True)
            
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.warning(f"Error creating indexes: {e}")

database = Database()