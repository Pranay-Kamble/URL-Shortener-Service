from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
import os
import redis.asyncio as redis

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv('DATABASE_URL')

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True
)
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()


redis_client = redis.Redis(
    host=os.getenv('REDIS_URL', 'localhost'),
    port=6379,
    decode_responses=True,
    db=0
)
