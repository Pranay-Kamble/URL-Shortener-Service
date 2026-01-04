import logging

from sqlalchemy.orm import Session
from db.database import redis_client, get_db, SessionLocal
from db.models import UrlTable
from datetime import datetime

logging.basicConfig(filename='sync_logs.log', level=logging.INFO, filemode='a')

def sync_redis_to_postgres():
    try:
        updated_short_codes_list = redis_client.keys('stats:*')
        db: Session = SessionLocal()

        for short_code_string in updated_short_codes_list:
            short_code = short_code_string.split(':')[-1]
            postgres_object = db.query(UrlTable).filter(UrlTable.shorturl == short_code).first()
            redis_cached_object = redis_client.hgetall(f'stats:{short_code}')

            if not postgres_object or not redis_cached_object or not redis_cached_object.get('is_updated'):
                continue

            postgres_object.last_click = datetime.strptime(redis_cached_object['last_click'], '%Y-%m-%d %H:%M:%S.%f')
            postgres_object.clicks = redis_cached_object.get('clicks')
            print(postgres_object)

        db.commit()
        logging.info(f'Sync to database performed at {datetime.now()}')

    except Exception as e:
        logging.error(f'Could not perform sync to database at {datetime.now()}\n Error Message: {e}')


if __name__ == '__main__':
    sync_redis_to_postgres()