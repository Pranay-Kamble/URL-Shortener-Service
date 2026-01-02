from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse
import services
from db.database import engine, Base, get_db
from schemas import UrlBody, UrlResponse
from db import db_url
from datetime import datetime
from db.models import UrlTable
app = FastAPI()
Base.metadata.create_all(engine)

@app.get("/")
def root(db: Session = Depends(get_db)):
    return db.query(UrlTable).all()

@app.post('/shorten', response_model=UrlResponse)
def shorten_url(body:UrlBody, db:Session = Depends(get_db)):
    result = services.shorten_url(body.url, body.duration, db)
    return UrlResponse(
        longurl=result.longurl,
        meta_data=result
    )


@app.get('/stats/{short_id}', response_model=UrlResponse)
def get_url_metadata(short_id: str, db: Session = Depends(get_db)):
    result = services.get_url_stats(short_id, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )
    else:
        return UrlResponse(
            longurl=result.longurl,
            meta_data=result
        )

@app.get('/{short_code}')
def redirect_to_long_url(short_code: str, db: Session = Depends(get_db)):
    result = services.get_redirect_url(short_code, db)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= 'Not a valid code'
        )
    elif result.get('expires_on') and result['expires_on'] < datetime.now():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail= 'Link has expired'
        )
    else:
        if db_url.update_clicks(short_code, db):
            return RedirectResponse(
                url=result['longurl']
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )