from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.schemas.common import ProductListItem, ProductDetailOut, CategoryOut
from app.services.product_service import ProductService
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=list[ProductListItem])
def list_products(
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
):
    return ProductService(db).list_products(search=search, category_id=category_id)

@router.get("/{product_id}", response_model=ProductDetailOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return ProductService(db).get_product(product_id)

@router.get("/{product_id}/similar", response_model=list[ProductListItem])
def similar_products(product_id: int, db: Session = Depends(get_db)):
    product = ProductService(db).get_product(product_id)
    if not product:
        return []
    return RecommendationService(db).similar_products(product)

@router.get("/meta/categories", response_model=list[CategoryOut])
def categories(db: Session = Depends(get_db)):
    return ProductService(db).get_categories()
