from sqlalchemy.orm import Session
from app.models.product import Product

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def similar_products(self, product: Product, limit: int = 4):
        candidates = self.db.query(Product).filter(Product.id != product.id).all()
        target = set(product.name.lower().split())
        scored = []
        for p in candidates:
            score = 0
            if p.category_id == product.category_id:
                score += 5
            if p.brand and product.brand and p.brand.lower() == product.brand.lower():
                score += 2
            shared = target & set(p.name.lower().split())
            score += len(shared) * 3
            diff = abs(float(p.price) - float(product.price))
            if diff <= max(100, float(product.price) * 0.2):
                score += 2
            scored.append((score, p))
        scored.sort(key=lambda x: (-x[0], x[1].id))
        return [p for s, p in scored if s > 0][:limit]
