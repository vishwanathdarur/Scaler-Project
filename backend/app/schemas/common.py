from pydantic import BaseModel, ConfigDict
from typing import List
from datetime import datetime

class CategoryOut(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)

class ProductImageOut(BaseModel):
    id: int
    image_url: str
    model_config = ConfigDict(from_attributes=True)

class ProductListItem(BaseModel):
    id: int
    name: str
    price: float
    stock: int
    brand: str
    category: CategoryOut
    images: List[ProductImageOut] = []
    model_config = ConfigDict(from_attributes=True)

class ProductDetailOut(ProductListItem):
    description: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    model_config = ConfigDict(from_attributes=True)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class CartItemOut(BaseModel):
    id: int
    quantity: int
    product: ProductListItem
    model_config = ConfigDict(from_attributes=True)

class OrderItemOut(BaseModel):
    id: int
    quantity: int
    price: float
    product: ProductListItem
    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: int
    user_order_number: int
    total_amount: float
    shipping_address: str
    status: str
    created_at: datetime
    items: List[OrderItemOut]
    model_config = ConfigDict(from_attributes=True)
