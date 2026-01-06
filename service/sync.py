import asyncio, logging, os

from sqlalchemy.future import select
from db.database import redis_client, AsyncSessionLocal
from db.models import UrlTable
from datetime import datetime
from dotenv import load_dotenv
load_dotenv()

logging.basicConfig(filename='../sync_logs.log', level=logging.INFO, filemode='a')

async def sync_redis_to_postgres():
    try:
        updated_short_codes_list = await redis_client.keys('stats:*')

        async with AsyncSessionLocal() as db:
            for short_code_string in updated_short_codes_list:
                short_code = short_code_string.split(':')[-1]
                postgres_statement = select(UrlTable).where(UrlTable.shorturl == short_code)
                postgres_object: UrlTable = (await db.execute(postgres_statement)).scalar()
                redis_cached_object = await redis_client.hgetall(f'stats:{short_code}')

                if not postgres_object or not redis_cached_object or not redis_cached_object.get('is_updated'):
                    continue

                postgres_object.last_click = datetime.strptime(redis_cached_object['last_click'], '%Y-%m-%d %H:%M:%S.%f')
                postgres_object.clicks = redis_cached_object.get('clicks')
                print(postgres_object)

            await db.commit()
            logging.info(f'Sync to database performed at {datetime.now()}')

    except Exception as e:
        logging.error(f'Could not perform sync to database at {datetime.now()}\n Error Message: {e}')


async def run_scheduler():
    while True:
        await sync_redis_to_postgres()
        await asyncio.sleep(int(os.getenv('SYNC_INTERVAL', 10)))

if __name__ == '__main__':
    asyncio.run(run_scheduler())