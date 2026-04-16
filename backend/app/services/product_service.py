from decimal import Decimal
from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.category import Category
from app.models.product_image import ProductImage
from app.models.cart_item import CartItem
from app.models.order_item import OrderItem
from app.services.lru_cache import catalog_cache
from app.services.trie import SearchTrie

REMOVED_PRODUCT_NAMES = [
    "Titleist Golf Balls",
    "Eero Mesh WiFi Router",
    "Le Creuset Dutch Oven",
    "Philips Air Fryer",
]

class ProductService:
    def __init__(self, db: Session):
        self.db = db

    def list_products(self, search: str | None = None, category_id: int | None = None):
        query = self.db.query(Product).options(joinedload(Product.category), joinedload(Product.images))
        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))
        if category_id:
            query = query.filter(Product.category_id == category_id)
        return query.order_by(Product.id.desc()).all()

    def get_product(self, product_id: int):
        return self.db.query(Product).options(joinedload(Product.category), joinedload(Product.images)).filter(Product.id == product_id).first()

    def get_categories(self):
        return self.db.query(Category).order_by(Category.name.asc()).all()

    def list_products_cached(self, search: str | None = None, category_id: int | None = None):
        cache_key = f"products:list:{search or ''}:{category_id or ''}"
        cached = catalog_cache.get(cache_key)
        if cached is not None:
            return cached

        products = [self._serialize_product(product) for product in self.list_products(search=search, category_id=category_id)]
        catalog_cache.put(cache_key, products)
        return products

    def get_product_cached(self, product_id: int):
        cache_key = f"products:detail:{product_id}"
        cached = catalog_cache.get(cache_key)
        if cached is not None:
            return cached

        product = self.get_product(product_id)
        if not product:
            return None

        payload = self._serialize_product(product)
        catalog_cache.put(cache_key, payload)
        return payload

    def get_categories_cached(self):
        cache_key = "products:categories"
        cached = catalog_cache.get(cache_key)
        if cached is not None:
            return cached

        categories = [{"id": category.id, "name": category.name} for category in self.get_categories()]
        catalog_cache.put(cache_key, categories)
        return categories

    def rebuild_trie(self):
        trie = SearchTrie()
        names = [p.name for p in self.db.query(Product).all()]
        trie.build(names)
        return trie

    def remove_deprecated_products(self):
        products = self.db.query(Product).filter(Product.name.in_(REMOVED_PRODUCT_NAMES)).all()
        if not products:
            return 0

        product_ids = [product.id for product in products]
        self.db.query(ProductImage).filter(ProductImage.product_id.in_(product_ids)).delete(synchronize_session=False)
        self.db.query(CartItem).filter(CartItem.product_id.in_(product_ids)).delete(synchronize_session=False)
        self.db.query(OrderItem).filter(OrderItem.product_id.in_(product_ids)).delete(synchronize_session=False)
        self.db.query(Product).filter(Product.id.in_(product_ids)).delete(synchronize_session=False)
        self.db.commit()
        catalog_cache.clear()
        return len(product_ids)

    def similar_products(self, product: Product, limit: int = 4):
        products = self.db.query(Product).options(joinedload(Product.category), joinedload(Product.images)).filter(Product.id != product.id).all()
        target_words = set(product.name.lower().split())
        scored = []
        for item in products:
            score = 0
            if item.category_id == product.category_id:
                score += 5
            if item.brand and product.brand and item.brand.lower() == product.brand.lower():
                score += 2
            shared = target_words & set(item.name.lower().split())
            score += len(shared) * 3
            price_diff = abs(float(item.price) - float(product.price))
            if price_diff <= max(100, float(product.price) * 0.2):
                score += 2
            scored.append((score, item))
        scored.sort(key=lambda x: (-x[0], x[1].id))
        return [item for score, item in scored if score > 0][:limit]

    def seed_products_if_empty(self):
        if self.db.query(Product).count() > 0:
            return
        categories = {
            "Electronics": Category(name="Electronics"),
            "Fashion": Category(name="Fashion"),
            "Home": Category(name="Home"),
            "Books": Category(name="Books"),
            "Sports": Category(name="Sports"),
        }
        self.db.add_all(categories.values())
        self.db.flush()
        samples = [
            # Electronics
            ("Apple iPhone 15", "Latest iPhone with stunning display and powerful camera.", 79999, 25, "Apple", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Samsung Galaxy S24", "Flagship Android phone with advanced AI features.", 69999, 18, "Samsung", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80",
                "https://images.unsplash.com/photo-1510557880182-3b7b5a7b2c4?auto=format&fit=crop&w=900&q=80"
            ]),
            ("MacBook Pro 16-inch", "Powerful laptop for professionals with M3 chip.", 199999, 8, "Apple", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Dell XPS 13", "Ultra-portable laptop with stunning display.", 129999, 12, "Dell", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Sony WH-1000XM5", "Industry-leading noise canceling wireless headphones.", 29999, 30, "Sony", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Apple Watch Series 9", "Advanced smartwatch with health monitoring.", 41999, 20, "Apple", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=900&q=80"
            ]),
            ("iPad Pro 12.9-inch", "Powerful tablet for creators and professionals.", 99999, 15, "Apple", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Nintendo Switch OLED", "Handheld gaming console with vibrant display.", 34999, 22, "Nintendo", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=900&q=80"
            ]),
            ("GoPro HERO11", "Action camera for adventure and sports.", 44999, 14, "GoPro", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Amazon Echo Dot", "Smart speaker with Alexa voice assistant.", 4999, 50, "Amazon", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Logitech MX Master 3S", "Advanced wireless mouse for productivity.", 8999, 35, "Logitech", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Samsung 55-inch QLED TV", "4K smart TV with quantum dot technology.", 89999, 10, "Samsung", categories["Electronics"].id, [
                "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=900&q=80"
            ]),

            # Fashion
            ("Nike Running Shoes", "Comfortable shoes for daily running and workouts.", 4999, 40, "Nike", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Adidas Ultraboost 23", "Premium running shoes with responsive cushioning.", 12999, 28, "Adidas", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Levi's 501 Jeans", "Classic straight fit jeans, timeless style.", 3999, 60, "Levi's", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80"
            ]),
            ("H&M Cotton T-Shirt", "Soft cotton crew neck t-shirt.", 799, 100, "H&M", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Zara Wool Coat", "Elegant wool coat for winter.", 8999, 25, "Zara", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Gucci Leather Handbag", "Luxury leather handbag with gold hardware.", 45000, 8, "Gucci", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Ray-Ban Aviator Sunglasses", "Classic aviator sunglasses.", 5999, 45, "Ray-Ban", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Nike Air Max 270", "Lifestyle sneakers with visible Air cushioning.", 8999, 32, "Nike", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Uniqlo HeatTech Thermal", "Warm thermal underwear for cold weather.", 1999, 75, "Uniqlo", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Puma Suede Classic", "Iconic platform sneakers.", 6999, 38, "Puma", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Supreme Box Logo Hoodie", "Premium cotton hoodie with box logo.", 7999, 20, "Supreme", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Rolex Submariner", "Luxury dive watch with ceramic bezel.", 1500000, 3, "Rolex", categories["Fashion"].id, [
                "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80"
            ]),

            # Home
            ("Wooden Study Desk", "Minimal wooden desk for work and study setups.", 8999, 12, "Urban", categories["Home"].id, [
                "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80"
            ]),
            ("IKEA KIVIK Sofa", "Comfortable 3-seater sofa with removable covers.", 24999, 15, "IKEA", categories["Home"].id, [
                "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Dyson V15 Vacuum", "Cordless vacuum cleaner with powerful suction.", 54999, 18, "Dyson", categories["Home"].id, [
                "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80"
            ]),
            ("KitchenAid Stand Mixer", "5-quart tilt-head stand mixer.", 29999, 10, "KitchenAid", categories["Home"].id, [
                "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80"
            ]),
            ("West Elm Bed Frame", "Modern platform bed with storage.", 34999, 8, "West Elm", categories["Home"].id, [
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Herman Miller Aeron Chair", "Ergonomic office chair with lumbar support.", 89999, 5, "Herman Miller", categories["Home"].id, [
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Casper Memory Foam Mattress", "Cooling gel memory foam mattress.", 44999, 9, "Casper", categories["Home"].id, [
                "https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Vitamix Blender", "Professional-grade blender for smoothies.", 39999, 14, "Vitamix", categories["Home"].id, [
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Breville Espresso Machine", "Automatic espresso machine with grinder.", 79999, 6, "Breville", categories["Home"].id, [
                "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
            ]),

            # Books
            ("Atomic Habits", "Bestselling book on habit formation and growth.", 399, 100, "Penguin", categories["Books"].id, [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("The Psychology of Money", "Timeless lessons on wealth and happiness.", 499, 80, "Jaico", categories["Books"].id, [
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Sapiens: A Brief History", "The history of humankind in one volume.", 599, 65, "Harper", categories["Books"].id, [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Dune", "Epic science fiction masterpiece.", 699, 45, "Ace", categories["Books"].id, [
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"
            ]),
            ("The Alchemist", "Inspirational tale of following dreams.", 299, 120, "HarperOne", categories["Books"].id, [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Educated", "Memoir of a woman who grew up in isolation.", 499, 70, "Random House", categories["Books"].id, [
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Becoming", "Michelle Obama's inspiring memoir.", 799, 55, "Crown", categories["Books"].id, [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("The Midnight Library", "Between life and death there is a library.", 599, 60, "Viking", categories["Books"].id, [
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Project Hail Mary", "A lone astronaut must save the earth.", 699, 50, "Ballantine", categories["Books"].id, [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("The Seven Husbands of Evelyn Hugo", "A reclusive Hollywood icon tells her story.", 599, 75, "Washington Square", categories["Books"].id, [
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Klara and the Sun", "A love story about an Artificial Friend.", 699, 40, "Faber & Faber", categories["Books"].id, [
                "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80"
            ]),
            ("The Thursday Murder Club", "Four unlikely friends meet weekly to investigate cold cases.", 599, 55, "Viking", categories["Books"].id, [
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80"
            ]),

            # Sports
            ("Yoga Mat Pro", "Premium mat for yoga, stretching and training.", 1299, 30, "FitPro", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Peloton Bike", "Interactive fitness bike with live classes.", 199999, 4, "Peloton", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Nike Air Zoom Pegasus", "Versatile running shoes for all distances.", 7999, 35, "Nike", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Bowflex SelectTech Dumbbells", "Adjustable dumbbells from 5-52.5 lbs.", 29999, 12, "Bowflex", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Wilson Pro Staff Tennis Racket", "Professional tennis racket.", 15999, 18, "Wilson", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Garmin Forerunner 265", "GPS running watch with advanced metrics.", 34999, 15, "Garmin", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Under Armour Compression Shirt", "Moisture-wicking compression athletic wear.", 2499, 50, "Under Armour", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Speedo Swim Goggles", "Anti-fog swim goggles for competitive swimming.", 1499, 60, "Speedo", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Manduka PRO Yoga Mat", "Extra thick yoga mat for comfort.", 8999, 20, "Manduka", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Adidas Soccer Ball", "Official match ball with superior grip.", 2999, 45, "Adidas", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?auto=format&fit=crop&w=900&q=80"
            ]),
            ("Fitbit Charge 6", "Advanced fitness tracker with GPS.", 12999, 25, "Fitbit", categories["Sports"].id, [
                "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?auto=format&fit=crop&w=900&q=80"
            ]),
        ]
        for name, desc, price, stock, brand, cat_id, images in samples:
            product = Product(name=name, description=desc, price=Decimal(str(price)), stock=stock, brand=brand, category_id=cat_id)
            self.db.add(product)
            self.db.flush()
            for img in images:
                self.db.add(ProductImage(product_id=product.id, image_url=img))
        self.db.commit()
        catalog_cache.clear()

    def _serialize_product(self, product: Product):
        return {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "stock": product.stock,
            "brand": product.brand,
            "category": {
                "id": product.category.id,
                "name": product.category.name,
            } if product.category else None,
            "images": [
                {
                    "id": image.id,
                    "image_url": image.image_url,
                }
                for image in product.images
            ],
        }
