from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
import utils
from db.database import engine, Base, get_db
from schemas import UrlBody, UrlResponse, UrlMetaData
from db import db_url
from datetime import datetime
from db.models import UrlTable
app = FastAPI()
Base.metadata.create_all(engine)

@app.get("/")
def root(db: Session = Depends(get_db)):
    return db.query(UrlTable).all()

@app.post('/shorten')
def shorten_url(body:UrlBody, db:Session = Depends(get_db)):
    long_url = body.url
    expiry_duration = body.duration
    return db_url.add_short_url(utils.create_absolute_url(long_url), db, expiry_duration)


@app.get('/stats/{short_id}', response_model=UrlResponse)
def get_url(short_id: str, db: Session = Depends(get_db)):
    result = db_url.get_url(short_id, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )
    elif result.expires_on is not None and result.expires_on < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail= 'Link has expired'
        )
    else:
        return UrlResponse(
            longurl=result.longurl,
            meta_data=result
        )

@app.get('/{short_url}')
def redirect_to_long_url(short_url: str, db: Session = Depends(get_db)):
    print(f"Short ID: {short_url}")
    result = db_url.get_url(short_url, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )
    elif result.expires_on is not None and result.expires_on < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail= 'Link has expired'
        )
    else:
        if db_url.update_clicks(short_url, db):
            return RedirectResponse(
                url=result.longurl
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )