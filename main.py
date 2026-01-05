from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.responses import RedirectResponse
import services
from db.database import engine, Base, get_db, redis_client
from schemas import UrlBody, ShortUrlResponse, LongUrlResponse
from db import db_url
from datetime import datetime
from db.models import UrlTable

@asynccontextmanager
async def lifespan(application: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await redis_client.aclose()
app = FastAPI(lifespan=lifespan)

@app.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    statement = select(UrlTable)
    return (await db.execute(statement)).scalars().all()

@app.post('/shorten', response_model=ShortUrlResponse)
async def shorten_url(body:UrlBody, db: AsyncSession = Depends(get_db)):
    result = await services.shorten_url(body.url, body.duration, db)
    return ShortUrlResponse(
        longurl=result.longurl
    )


@app.get('/stats/{short_id}', response_model=LongUrlResponse)
async def get_url_metadata(short_id: str, db: AsyncSession = Depends(get_db)):
    result = await services.get_url_stats(short_id, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )
    else:
        return LongUrlResponse(
            longurl=result.longurl,
            meta_data=result
        )

@app.get('/{short_code}')
async def redirect_to_long_url(short_code: str, db: AsyncSession = Depends(get_db)):
    result = await services.get_redirect_url(short_code, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )
    elif result.expires_on and result.expires_on < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail= 'Link has expired'
        )
    else:
        if await db_url.update_analytics(short_code, db):
            return RedirectResponse(
                url=result.longurl
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )