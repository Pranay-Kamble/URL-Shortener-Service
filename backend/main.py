from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.responses import RedirectResponse, PlainTextResponse

from db.database import engine, Base, get_db, redis_client
from db.schemas import UrlBody, ShortUrlResponse, LongUrlResponse
from db import db_url
from datetime import datetime
from db.models import UrlTable
from service import services

@asynccontextmanager
async def lifespan(application: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await redis_client.aclose()
app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:3000",     
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root(db: AsyncSession = Depends(get_db)):
    return PlainTextResponse(
        content="You have successfully reached URL Shortener endpoint",
        status_code=status.HTTP_200_OK
    )
    statement = select(UrlTable)
    return (await db.execute(statement)).scalars().all()

@app.post('/shorten', response_model=ShortUrlResponse)
async def shorten_url(body:UrlBody, db: AsyncSession = Depends(get_db)):
    result = await services.shorten_url(body.url, body.duration, db)
    return ShortUrlResponse(
        shorturl=result.shorturl
    )


@app.get('/stats/{short_id}', response_model=LongUrlResponse)
async def get_url_metadata(short_id: str, db: AsyncSession = Depends(get_db)):
    result = await services.get_url_stats(short_id, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )

    # Parse expiry — result fields may be strings (from Redis) or datetimes (from DB)
    expires_on = result.expires_on
    if isinstance(expires_on, str):
        try:
            expires_on = datetime.strptime(expires_on, '%Y-%m-%d %H:%M:%S.%f')
        except ValueError:
            expires_on = datetime.strptime(expires_on, '%Y-%m-%d %H:%M:%S')

    is_expired = bool(expires_on and expires_on < datetime.now())

    return LongUrlResponse(
        longurl="[URL HIDDEN — LINK EXPIRED]" if is_expired else result.longurl,
        is_expired=is_expired,
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