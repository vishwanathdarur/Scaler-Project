from decimal import Decimal
from pathlib import Path
import sys

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.connection import Base
from app.models import user, category, product, product_image, cart_item, order, order_item  # noqa: F401
from app.models.category import Category
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.user import User
from app.utils.security import hash_password


@pytest.fixture()
def db_session(tmp_path):
    db_file = tmp_path / "test_amazon_clone.db"
    engine = create_engine(f"sqlite:///{db_file}", connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def sample_user(db_session):
    user = User(
        name="Charlie",
        email="charlie@example.com",
        password_hash=hash_password("secret123"),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def sample_category(db_session):
    category = Category(name="Electronics")
    db_session.add(category)
    db_session.commit()
    db_session.refresh(category)
    return category


def create_product(db_session, *, name, category_id, price=999.0, stock=10, brand="DemoBrand", image_url="https://example.com/product.jpg"):
    product = Product(
        name=name,
        description=f"{name} description",
        price=Decimal(str(price)),
        stock=stock,
        brand=brand,
        category_id=category_id,
    )
    db_session.add(product)
    db_session.flush()
    db_session.add(ProductImage(product_id=product.id, image_url=image_url))
    db_session.commit()
    db_session.refresh(product)
    return product
