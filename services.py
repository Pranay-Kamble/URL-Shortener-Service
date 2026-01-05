from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from db import db_url
from db.database import redis_client
from db.models import UrlTable
import utils

def parse_date(date_str: str):
    if not date_str or date_str == "None":
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S.%f')
    except ValueError:
        try:
            return datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
        except:
            return None


async def shorten_url(long_url: str, expiry_duration: int, db: AsyncSession):
    absolute_url = utils.create_absolute_url(long_url)
    return await db_url.add_short_url(absolute_url, db, expiry_duration)


async def get_url_stats(short_code: str, db: AsyncSession):
    cache_result = await redis_client.hgetall(f'stats:{short_code}')
    if cache_result:
        return UrlTable(
            longurl=cache_result.get('longurl'),
            shorturl=short_code,
            clicks=int(cache_result.get('clicks',0)),
            last_click=cache_result.get('last_click'),
            expires_on=cache_result.get('expires_on'),
            created_at=cache_result.get('created_at')
        )

    return await db_url.get_url_data(short_code, db)


async def get_redirect_url(short_code: str, db: AsyncSession):
    cache_result = await redis_client.hgetall(f'url:{short_code}')

    if cache_result:
        expires_str = cache_result.get('expires_on')
        expiration_date = parse_date(expires_str)

        if expiration_date and expiration_date < datetime.now():
            return None

        return UrlTable(
            longurl=cache_result['longurl'],
            expires_on=expiration_date
        )

    result = await db_url.get_url_data(short_code, db)

    if result:
        if result.expires_on and result.expires_on < datetime.now():
            return None

        return UrlTable(
            longurl=result.longurl,
            expires_on=result.expires_on
        )

    return None