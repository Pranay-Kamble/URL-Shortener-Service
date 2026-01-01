from sqlalchemy.orm import Session
from db.models import UrlTable
from datetime import datetime, timedelta
import utils

def update_clicks(short_url: str, db:Session):

    data_object = db.query(UrlTable).filter(UrlTable.shorturl == short_url).first()

    if data_object is None:
        print("Clicks could not be updated")
        return False

    data_object.clicks = data_object.clicks + 1
    data_object.last_click = datetime.now()

    db.commit()
    return True

#Create URL
def add_short_url(long_url: str, db: Session, expiry_time: int):
    """
    Get the shortened code and map it to the database
    :param long_url: The URL which has to be shortened
    :param expiry_time: Time in hours, after which the url will expire
    :param db: The database connection object
    :return: string, representing the short url
    """
    url_object = UrlTable(
        longurl = long_url,
    )
    db.add(url_object)
    db.flush()

    url_id = url_object.id
    short_url = utils.perform_shortening(utils.scramble_id(url_id))

    url_object.shorturl = short_url
    url_object.created_at = datetime.now()
    url_object.expires_on = url_object.created_at + timedelta(hours=expiry_time)
    db.commit()

    return url_object

#Read
def get_url(short_code: str, db:Session):
    result = db.query(UrlTable).filter(UrlTable.shorturl == short_code).first()

    if result is None:
        return None
    else:
        return result