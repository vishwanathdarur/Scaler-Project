from app.services.lru_cache import LRUCache, catalog_cache
from app.services.product_service import ProductService

from conftest import create_product


def test_lru_cache_get_put_and_eviction():
    cache = LRUCache(capacity=2)

    cache.put("a", 1)
    cache.put("b", 2)

    assert cache.get("a") == 1

    cache.put("c", 3)

    assert cache.get("a") == 1
    assert cache.get("b") is None
    assert cache.get("c") == 3


def test_cached_product_list_reuses_cached_response(db_session, sample_category, monkeypatch):
    catalog_cache.clear()
    create_product(db_session, name="Gaming Mouse", category_id=sample_category.id)
    service = ProductService(db_session)

    call_count = {"count": 0}
    original = ProductService.list_products

    def tracked_list_products(self, search=None, category_id=None):
        call_count["count"] += 1
        return original(self, search=search, category_id=category_id)

    monkeypatch.setattr(ProductService, "list_products", tracked_list_products)

    first = service.list_products_cached()
    second = service.list_products_cached()

    assert len(first) == 1
    assert first == second
    assert call_count["count"] == 1


def test_cached_product_detail_reuses_cached_response(db_session, sample_category, monkeypatch):
    catalog_cache.clear()
    product = create_product(db_session, name="Mechanical Keyboard", category_id=sample_category.id, stock=7)
    service = ProductService(db_session)

    call_count = {"count": 0}
    original = ProductService.get_product

    def tracked_get_product(self, product_id):
        call_count["count"] += 1
        return original(self, product_id)

    monkeypatch.setattr(ProductService, "get_product", tracked_get_product)

    first = service.get_product_cached(product.id)
    second = service.get_product_cached(product.id)

    assert first["id"] == product.id
    assert first == second
    assert call_count["count"] == 1


def test_cached_categories_reuse_cached_response(db_session, sample_category, monkeypatch):
    catalog_cache.clear()
    service = ProductService(db_session)

    call_count = {"count": 0}
    original = ProductService.get_categories

    def tracked_get_categories(self):
        call_count["count"] += 1
        return original(self)

    monkeypatch.setattr(ProductService, "get_categories", tracked_get_categories)

    first = service.get_categories_cached()
    second = service.get_categories_cached()

    assert len(first) == 1
    assert first == second
    assert call_count["count"] == 1
