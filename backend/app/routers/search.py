from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.services.product_service import ProductService

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/suggest")
def suggest(q: str = Query(default=""), db: Session = Depends(get_db)):
    trie = ProductService(db).rebuild_trie()
    return {"suggestions": trie.suggest(q)}
