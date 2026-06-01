from db.database import Base
from sqlalchemy import Column, String, DateTime, Integer


class UrlTable(Base):
    __tablename__ = 'url_data'
    id = Column(Integer, primary_key=True)
    longurl = Column(String)
    shorturl = Column(String, unique=True, index=True)
    clicks = Column(Integer, default=0)
    created_at = Column(DateTime)
    last_click = Column(DateTime, nullable=True)
    expires_on = Column(DateTime, nullable=True)