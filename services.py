from datetime import datetime
from sqlalchemy.orm import Session
from db import db_url
from db.database import redis_client
from db.models import UrlTable
import utils


def shorten_url(long_url: str, expiry_duration: int, db:Session):
    absolute_url = utils.create_absolute_url(long_url)
    print(absolute_url)
    return db_url.add_short_url(absolute_url, db, expiry_duration)


def get_url_stats(short_code: str, db: Session):
    cache_result = redis_client.hgetall(f'stats:{short_code}')
    if cache_result:
        return UrlTable(
            longurl=cache_result.get('longurl'),
            shorturl=short_code,
            clicks=int(cache_result.get('clicks',0)),
            last_click=cache_result.get('last_click'),
            expires_on=cache_result.get('expires_on'),
            created_at=cache_result.get('created_at')
        )

    return db_url.get_url_data(short_code, db)


def get_redirect_url(short_code: str, db: Session):
    cache_result = redis_client.hgetall(f'url:{short_code}')

    if cache_result:
        expires_str = cache_result.get('expires_on')
        expiration_date = None

        if expires_str and expires_str != "" and expires_str != "None":
            try:
                expiration_date = datetime.strptime(expires_str, '%Y-%m-%d %H:%M:%S.%f')
            except ValueError:
                try:
                    expiration_date = datetime.strptime(expires_str, '%Y-%m-%d %H:%M:%S')
                except:
                    pass

        if expiration_date and expiration_date < datetime.now():
            return None

        return UrlTable(
            longurl=cache_result['longurl'],
            expires_on=expiration_date
        )

    result = db_url.get_url_data(short_code, db)

    if result:
        return UrlTable(
            longurl=result.longurl,
            expires_on=result.expires_on
        )

    return None
