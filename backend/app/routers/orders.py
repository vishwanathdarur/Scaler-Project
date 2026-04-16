from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.order import OrderCreateIn
from app.schemas.common import OrderOut
from app.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return OrderService(db).list_orders(user)

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return OrderService(db).get_order(user, order_id)

@router.post("")
def create_order(payload: OrderCreateIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    order = OrderService(db).place_order(user, payload.shipping_address)
    return {"message": "Order placed successfully", "order_id": order.user_order_number}
