from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User

class CartService:
    def __init__(self, db: Session):
        self.db = db

    def get_cart(self, user: User):
        return self.db.query(CartItem).options(
            joinedload(CartItem.product).joinedload(Product.category),
            joinedload(CartItem.product).joinedload(Product.images),
        ).filter(CartItem.user_id == user.id).all()

    def add_to_cart(self, user: User, product_id: int, quantity: int = 1):
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.stock < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough stock")
        item = self.db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.product_id == product_id).first()
        if item:
            item.quantity += quantity
        else:
            item = CartItem(user_id=user.id, product_id=product_id, quantity=quantity)
            self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update_item(self, user: User, cart_item_id: int, quantity: int):
        item = self.db.query(CartItem).filter(CartItem.id == cart_item_id, CartItem.user_id == user.id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        product = self.db.query(Product).filter(Product.id == item.product_id).first()
        if product.stock < quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not enough stock")
        item.quantity = quantity
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_item(self, user: User, cart_item_id: int):
        item = self.db.query(CartItem).filter(CartItem.id == cart_item_id, CartItem.user_id == user.id).first()
        if not item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
        self.db.delete(item)
        self.db.commit()
