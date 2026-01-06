from dotenv import load_dotenv
from urllib.parse import urlparse
import os

load_dotenv()

BASE62 = os.getenv('BASE62')
BASE = len(BASE62)
MIN_OFFSET = int(os.getenv('MIN_LENGTH_OFFSET'))

def scramble_id(db_id: int) -> int:
    secret = int(os.getenv('SCRAMBLER_SECRET'))
    prime = int(os.getenv('SCRAMBLER_PRIME'))
    scrambled_id = (db_id * secret) % prime

    return scrambled_id

def perform_shortening(scrambled_id: int) -> str:
    if scrambled_id == 0:
        return BASE62[0]

    long_id = scrambled_id + MIN_OFFSET
    short_url_list = []
    while long_id > 0:
        long_id, rem = divmod(long_id, BASE)
        short_url_list.append(BASE62[rem])

    return ''.join(short_url_list)

def create_absolute_url(long_url: str) -> str:
    long_url = long_url.strip()
    result = urlparse(long_url)

    if not result.scheme:
        return f"https://{long_url}"
    if result.scheme == 'http':
        return long_url.replace('http://', 'https://', 1)

    return long_url


if __name__ == '__main__':
    url = 'www.google.com'
    print(create_absolute_url(url))