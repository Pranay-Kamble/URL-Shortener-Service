from sqlalchemy.orm import Session
from db.models import UrlTable
from datetime import datetime, timedelta
import utils
from db.database import redis_client

def update_clicks(short_code: str, db:Session):

    redis_key = f'stats:{short_code}'
    cached_result = redis_client.hgetall(redis_key)

    if cached_result:
        pipe = redis_client.pipeline()
        pipe.hincrby(redis_key, 'clicks', 1)
        pipe.hset(redis_key, 'last_click', f'{str(datetime.now())}')
        pipe.execute()

    data_object = db.query(UrlTable).filter(UrlTable.shorturl == short_code).first()

    if data_object is None:
        print("Clicks could not be updated")
        return False

    data_object.clicks = data_object.clicks + 1
    data_object.last_click = datetime.now()

    db.commit()
    return True

#Create URL
def add_short_url(long_url: str, db: Session, expiry_time: int):
    url_object = UrlTable(
        longurl = long_url,
    )
    db.add(url_object)
    db.flush()

    url_id = url_object.id
    short_code = utils.perform_shortening(utils.scramble_id(url_id))

    url_object.shorturl = short_code
    url_object.created_at = datetime.now()
    url_object.expires_on = url_object.created_at + timedelta(hours=expiry_time)
    db.commit()
    db.refresh(url_object)

    return url_object

#Read
def get_url_data(short_code: str, db: Session):
    result = db.query(UrlTable).filter(UrlTable.shorturl == short_code).first()

    if result:
        expires_str = str(result.expires_on) if result.expires_on else ""
        last_click_str = str(result.last_click) if result.last_click else ""

        redis_client.hset(f'url:{short_code}', mapping={
            "longurl": result.longurl,
            "expires_on": expires_str
        })
        redis_client.expire(f'url:{short_code}', 24 * 60 * 60)

        redis_client.hset(f'stats:{short_code}', mapping={
            "longurl": result.longurl,
            "clicks": result.clicks,
            "last_click": last_click_str,
            "expires_on": expires_str,
            "created_at": str(result.created_at)
        })
        return result

    return None