from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.cart import CartAddIn, CartUpdateIn
from app.schemas.common import CartItemOut
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.get("", response_model=list[CartItemOut])
def get_cart(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).get_cart(user)

@router.post("/add", response_model=CartItemOut)
def add_to_cart(payload: CartAddIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).add_to_cart(user, payload.product_id, payload.quantity)

@router.put("/{cart_item_id}", response_model=CartItemOut)
def update_item(cart_item_id: int, payload: CartUpdateIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return CartService(db).update_item(user, cart_item_id, payload.quantity)

@router.delete("/{cart_item_id}")
def delete_item(cart_item_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    CartService(db).remove_item(user, cart_item_id)
    return {"message": "Deleted"}
