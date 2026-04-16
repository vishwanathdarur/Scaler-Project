from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User
from app.services.email_service import EmailService

class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def list_orders(self, user: User):
        return self.db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category),
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.images),
        ).filter(Order.user_id == user.id).order_by(Order.id.desc()).all()

    def get_order(self, user: User, order_id: int):
        order = self.db.query(Order).options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category),
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.images),
        ).filter(Order.user_id == user.id, Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def place_order(self, user: User, shipping_address: str):
        cart_items = self.db.query(CartItem).options(joinedload(CartItem.product)).filter(CartItem.user_id == user.id).all()
        if not cart_items:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")
        total = 0.0
        for item in cart_items:
            if item.product.stock < item.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Not enough stock for {item.product.name}")
            total += float(item.product.price) * item.quantity

        # Get the next order number for this user
        max_order_num = self.db.query(Order.user_order_number).filter(Order.user_id == user.id).order_by(Order.user_order_number.desc()).first()
        next_order_num = (max_order_num[0] + 1) if max_order_num else 1

        order = Order(user_id=user.id, user_order_number=next_order_num, total_amount=total, shipping_address=shipping_address, status="PLACED")
        self.db.add(order)
        self.db.flush()

        for item in cart_items:
            item.product.stock -= item.quantity
            self.db.add(OrderItem(order_id=order.id, product_id=item.product_id, quantity=item.quantity, price=item.product.price))

        for item in cart_items:
            self.db.delete(item)

        self.db.commit()
        self.db.refresh(order)
        email_result = self._send_order_confirmation_email(user, order, shipping_address, cart_items)
        return order, email_result

    def _send_order_confirmation_email(self, user: User, order: Order, shipping_address: str, cart_items: list[CartItem]):
        item_lines = [
            f"- {item.product.name} x {item.quantity} (Rs. {float(item.product.price) * item.quantity:.2f})"
            for item in cart_items
        ]
        try:
            return EmailService().send_order_confirmation(
                to_email=user.email,
                customer_name=user.name,
                order_number=order.user_order_number,
                total_amount=float(order.total_amount),
                shipping_address=shipping_address,
                item_lines=item_lines,
            )
        except Exception:
            # Email is best-effort so a mail failure does not block checkout.
            return {"sent": False, "recipient": user.email, "reason": "send_failed"}
