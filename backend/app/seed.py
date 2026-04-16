import os
from sqlalchemy import text
from app.database.connection import Base, engine, SessionLocal
from app.models import user, category, product, product_image, cart_item, order, order_item
from app.models.user import User
from app.services.product_service import ProductService
from app.utils.security import hash_password

def ensure_order_user_number_column():
    with engine.begin() as conn:
        if engine.url.drivername.startswith("sqlite"):
            result = conn.execute(text("PRAGMA table_info(orders)"))
            columns = [row[1] for row in result]
            if "user_order_number" not in columns:
                conn.execute(text("ALTER TABLE orders ADD COLUMN user_order_number INTEGER DEFAULT 0"))
                existing_orders = conn.execute(text("SELECT id, user_id FROM orders ORDER BY user_id, id")).all()
                user_counts = {}
                for order_id, user_id in existing_orders:
                    user_counts[user_id] = user_counts.get(user_id, 0) + 1
                    conn.execute(
                        text("UPDATE orders SET user_order_number = :num WHERE id = :id"),
                        {"num": user_counts[user_id], "id": order_id},
                    )


def init_db():
    Base.metadata.create_all(bind=engine)
    ensure_order_user_number_column()
    db = SessionLocal()
    try:
        ensure_demo_user(db)
        product_service = ProductService(db)
        product_service.remove_deprecated_products()
        product_service.seed_products_if_empty()
    finally:
        db.close()


def ensure_demo_user(db):
    demo_name = os.getenv("DEMO_USER_NAME", "Charlie")
    demo_email = os.getenv("DEMO_USER_EMAIL", "vpcharlie777@gmail.com")
    demo_password = os.getenv("DEMO_USER_PASSWORD", "charlie123")

    existing_user = db.query(User).filter(User.email == demo_email).first()
    if existing_user:
        if existing_user.name != demo_name:
            existing_user.name = demo_name
            db.commit()
        return existing_user

    demo_user = User(name=demo_name, email=demo_email, password_hash=hash_password(demo_password))
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    return demo_user
