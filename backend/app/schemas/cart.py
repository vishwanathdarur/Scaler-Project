from pydantic import BaseModel, Field

class CartAddIn(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)

class CartUpdateIn(BaseModel):
    quantity: int = Field(ge=1)
