import logging
from datetime import datetime
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from db.database import redis_client
from db.models import UrlTable

logging.basicConfig(filename='../sync_logs.log', level=logging.INFO, filemode='a')

async def sync_redis_to_postgres(db: AsyncSession):
    try:
        updated_short_codes_list = await redis_client.keys('stats:*')
        synced_codes = []

        for short_code_string in updated_short_codes_list:
            short_code = short_code_string.split(':')[-1]
            redis_cached_object = await redis_client.hgetall(f'stats:{short_code}')

            # Only sync if the stats actually changed
            if not redis_cached_object or redis_cached_object.get('is_updated') != '1':
                continue

            postgres_statement = select(UrlTable).where(UrlTable.shorturl == short_code)
            postgres_object: UrlTable = (await db.execute(postgres_statement)).scalar()

            if not postgres_object:
                continue

            # Parse last_click from Redis
            last_click_str = redis_cached_object.get('last_click')
            if last_click_str:
                try:
                    postgres_object.last_click = datetime.strptime(last_click_str, '%Y-%m-%d %H:%M:%S.%f')
                except ValueError:
                    try:
                        postgres_object.last_click = datetime.strptime(last_click_str, '%Y-%m-%d %H:%M:%S')
                    except Exception as e:
                        logging.warning(f'Could not parse date {last_click_str} for {short_code}: {e}')

            postgres_object.clicks = int(redis_cached_object.get('clicks', 0))
            
            # Reset the is_updated flag in Redis
            await redis_client.hdel(f'stats:{short_code}', 'is_updated')
            synced_codes.append(short_code)

        if synced_codes:
            await db.commit()
            logging.info(f'Sync to database performed for codes {synced_codes} at {datetime.now()}')
        else:
            logging.info(f'Sync checked at {datetime.now()} - no updates required.')
            
        return synced_codes

    except Exception as e:
        logging.error(f'Could not perform sync to database at {datetime.now()}\n Error Message: {e}')
        raise e