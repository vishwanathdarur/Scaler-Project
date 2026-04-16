from pydantic import BaseModel, Field

class OrderCreateIn(BaseModel):
    shipping_address: str = Field(min_length=5)
