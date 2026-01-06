from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UrlMetaData(BaseModel):
    clicks: int
    created_at: datetime
    expires_on: datetime
    last_click: datetime | None
    model_config = ConfigDict(from_attributes=True)


class ShortUrlResponse(BaseModel):
    shorturl: str
    model_config = ConfigDict(from_attributes=True)

class LongUrlResponse(BaseModel):
    longurl: str
    meta_data: UrlMetaData
    model_config = ConfigDict(from_attributes=True)

class UrlBody(BaseModel):
    url: str
    duration: int | None = 72
