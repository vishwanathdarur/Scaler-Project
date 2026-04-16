import pytest
from fastapi import HTTPException

from app.models.cart_item import CartItem
from app.models.category import Category
from app.models.order import Order
from app.services.auth_service import AuthService
from app.services.cart_service import CartService
from app.services.order_service import OrderService
from app.services.product_service import ProductService
from app.utils.security import create_access_token, decode_access_token, hash_password, verify_password

from conftest import create_product


def test_password_hashing_and_token_roundtrip():
    password_hash = hash_password("secret123")

    assert verify_password("secret123", password_hash) is True
    assert verify_password("wrong-pass", password_hash) is False

    token = create_access_token({"sub": "42"})
    payload = decode_access_token(token)

    assert payload["sub"] == "42"
    assert "exp" in payload


def test_auth_service_signup_and_login(db_session):
    auth_service = AuthService(db_session)
    signup_payload = type("SignupPayload", (), {"name": "Alice", "email": "alice@example.com", "password": "secret123"})()
    login_payload = type("LoginPayload", (), {"email": "alice@example.com", "password": "secret123"})()

    user, signup_token = auth_service.signup(signup_payload)
    logged_in_user, login_token = auth_service.login(login_payload)

    assert user.email == "alice@example.com"
    assert logged_in_user.id == user.id
    assert signup_token
    assert login_token


def test_product_service_filters_by_search_and_category(db_session, sample_category):
    books = Category(name="Books")
    db_session.add(books)
    db_session.commit()
    db_session.refresh(books)

    phone = create_product(db_session, name="Galaxy Phone", category_id=sample_category.id, brand="Samsung")
    create_product(db_session, name="Python Handbook", category_id=books.id, brand="OReilly")

    product_service = ProductService(db_session)
    by_search = product_service.list_products(search="Galaxy")
    by_category = product_service.list_products(category_id=books.id)

    assert [product.id for product in by_search] == [phone.id]
    assert len(by_category) == 1
    assert by_category[0].name == "Python Handbook"


def test_product_service_similar_products_prefers_related_items(db_session, sample_category):
    target = create_product(db_session, name="Apple Watch Series 9", category_id=sample_category.id, price=41999, brand="Apple")
    similar = create_product(db_session, name="Apple Watch Band", category_id=sample_category.id, price=3999, brand="Apple")
    create_product(db_session, name="Wooden Desk", category_id=sample_category.id, price=19999, brand="Urban")

    results = ProductService(db_session).similar_products(target)

    assert results
    assert results[0].id == similar.id


def test_cart_service_add_update_and_remove_item(db_session, sample_user, sample_category):
    product = create_product(db_session, name="Noise Cancelling Headphones", category_id=sample_category.id, stock=12)
    cart_service = CartService(db_session)

    item = cart_service.add_to_cart(sample_user, product.id, 2)
    assert item.quantity == 2

    updated_item = cart_service.update_item(sample_user, item.id, 4)
    cart_service.remove_item(sample_user, item.id)

    assert updated_item.quantity == 4
    assert db_session.query(CartItem).count() == 0


def test_order_service_places_order_clears_cart_and_reduces_stock(db_session, sample_user, sample_category):
    product = create_product(db_session, name="Running Shoes", category_id=sample_category.id, price=2499, stock=8)
    CartService(db_session).add_to_cart(sample_user, product.id, 3)

    order = OrderService(db_session).place_order(sample_user, "Mumbai, Maharashtra - 400001")
    db_session.refresh(product)

    assert isinstance(order, Order)
    assert order.user_order_number == 1
    assert float(order.total_amount) == 7497.0
    assert product.stock == 5
    assert db_session.query(CartItem).count() == 0


def test_order_service_rejects_empty_cart(db_session, sample_user):
    with pytest.raises(HTTPException) as exc_info:
        OrderService(db_session).place_order(sample_user, "Bengaluru, Karnataka - 560001")

    assert exc_info.value.detail == "Cart is empty"
