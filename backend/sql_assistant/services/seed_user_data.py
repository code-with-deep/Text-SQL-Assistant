"""
Auto-seeds per-user ecommerce data at signup time.

Each new user gets a realistic dataset (~50 customers, ~30 products,
~200 orders, ~100 reviews) so they can start querying immediately.
Uses shared global categories. All records are stamped with user_id.
"""

import random
import logging
from datetime import date, timedelta
from decimal import Decimal

from django.db import transaction
from faker import Faker

from ecommerce.models import Category, Customer, Product, Order, OrderItem, Review

logger = logging.getLogger('sql_assistant')

# Use a per-call Faker instance; seed per-user for variety
fake = Faker()


class UserDataSeeder:
    """Seeds ecommerce data for a single user. Call .seed() after user creation."""

    # Configurable counts — small enough for fast signup, big enough for real queries
    CUSTOMER_COUNT = 50
    PRODUCT_COUNT = 30
    ORDER_COUNT = 200
    REVIEW_COUNT = 100

    def __init__(self, user):
        self.user = user

    def seed(self):
        """Main entry point. Returns summary dict on success."""
        # Seed Faker with user pk for deterministic-per-user but varied-across-users data
        user_seed = self.user.pk if self.user.pk else random.randint(1, 999999)
        Faker.seed(user_seed)
        random.seed(user_seed)

        try:
            with transaction.atomic():
                categories = self._ensure_categories()
                customers = self._create_customers()
                products = self._create_products(categories)
                orders, order_items = self._create_orders_and_items(customers, products)
                reviews = self._create_reviews(customers, products, order_items)

            summary = {
                'customers': len(customers),
                'products': len(products),
                'orders': len(orders),
                'order_items': len(order_items),
                'reviews': len(reviews),
            }
            logger.info(
                "Seeded data for user %s (id=%s): %s",
                self.user.email, self.user.pk, summary,
            )
            return summary

        except Exception as exc:
            logger.error("Failed to seed data for user %s: %s", self.user.pk, exc, exc_info=True)
            raise

    # ------------------------------------------------------------------
    # Categories (shared — create only if table is empty)
    # ------------------------------------------------------------------

    def _ensure_categories(self):
        """Return child categories. Create the full hierarchy if none exist."""
        if Category.objects.exists():
            return list(Category.objects.filter(parent_category__isnull=False))

        categories_data = {
            "Electronics": ["Laptops", "Smartphones", "Audio", "Wearables"],
            "Apparel": ["Men's Wear", "Women's Wear", "Footwear", "Accessories"],
            "Home & Kitchen": ["Cookware", "Bedding", "Appliances", "Furniture"],
            "Sports & Outdoors": ["Fitness", "Camping", "Cycling", "Athletic Apparel"],
            "Books": ["Fiction", "Non-Fiction", "Self-Help", "Children's Books"],
        }

        children = []
        for parent_name, child_names in categories_data.items():
            parent = Category.objects.create(
                name=parent_name,
                description=f"Quality products in {parent_name} category.",
            )
            for child_name in child_names:
                child = Category.objects.create(
                    name=child_name,
                    parent_category=parent,
                    description=f"Explore premium {child_name} accessories and gear.",
                )
                children.append(child)

        return children

    # ------------------------------------------------------------------
    # Customers
    # ------------------------------------------------------------------

    def _create_customers(self):
        cities_by_country = {
            "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Seattle", "Austin"],
            "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
            "France": ["Paris", "Lyon", "Marseille"],
            "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg"],
            "Japan": ["Tokyo", "Osaka", "Kyoto"],
            "Australia": ["Sydney", "Melbourne", "Brisbane"],
        }
        countries = list(cities_by_country.keys())
        tiers = ['bronze', 'silver', 'gold']
        tier_weights = [0.65, 0.25, 0.10]

        start_date = date.today() - timedelta(days=730)
        objs = []
        seen_emails = set()

        for _ in range(self.CUSTOMER_COUNT):
            email = fake.email()
            while email in seen_emails:
                email = fake.email()
            seen_emails.add(email)

            country = random.choice(countries)
            city = random.choice(cities_by_country[country])
            tier = random.choices(tiers, weights=tier_weights)[0]
            joined = start_date + timedelta(days=random.randint(0, 700))

            objs.append(Customer(
                user=self.user,
                name=fake.name(),
                email=email,
                city=city,
                country=country,
                tier=tier,
                joined_date=joined,
            ))

        return Customer.objects.bulk_create(objs)

    # ------------------------------------------------------------------
    # Products
    # ------------------------------------------------------------------

    def _create_products(self, categories):
        brands = ["TechCorp", "ApexGear", "SleekStyles", "EcoKitchen",
                   "AuraSound", "VeloSports", "ReadPulse"]

        objs = []
        start_date = date.today() - timedelta(days=730)

        for i in range(self.PRODUCT_COUNT):
            cat = random.choice(categories)
            brand = random.choice(brands)

            # Category-aware pricing
            parent_name = cat.parent_category.name if cat.parent_category else cat.name
            if parent_name == "Electronics":
                price = round(random.uniform(99.00, 1499.00), 2)
            elif parent_name == "Apparel":
                price = round(random.uniform(19.99, 149.99), 2)
            elif parent_name == "Home & Kitchen":
                price = round(random.uniform(25.00, 499.00), 2)
            else:
                price = round(random.uniform(9.99, 89.99), 2)

            objs.append(Product(
                user=self.user,
                name=f"{brand} {cat.name} v{random.randint(1, 9)}",
                category=cat,
                brand=brand,
                price=Decimal(str(price)),
                stock_qty=random.randint(5, 450),
                created_date=start_date + timedelta(days=random.randint(0, 300)),
            ))

        return Product.objects.bulk_create(objs)

    # ------------------------------------------------------------------
    # Orders + OrderItems
    # ------------------------------------------------------------------

    def _create_orders_and_items(self, customers, products):
        statuses = ['pending', 'shipped', 'delivered', 'cancelled']
        status_weights = [0.05, 0.15, 0.75, 0.05]

        orders_to_create = []
        for _ in range(self.ORDER_COUNT):
            customer = random.choice(customers)
            days_active = (date.today() - customer.joined_date).days
            if days_active <= 1:
                order_date = customer.joined_date
            else:
                order_date = customer.joined_date + timedelta(
                    days=random.randint(0, days_active - 1)
                )

            orders_to_create.append(Order(
                user=self.user,
                customer=customer,
                order_date=order_date,
                status=random.choices(statuses, weights=status_weights)[0],
                total_amount=Decimal('0.00'),
            ))

        created_orders = Order.objects.bulk_create(orders_to_create)

        # Create order items and back-calculate totals
        items_to_create = []
        for order in created_orders:
            num_items = random.choices([1, 2, 3, 4], weights=[0.35, 0.35, 0.20, 0.10])[0]
            selected = random.sample(products, min(num_items, len(products)))

            order_total = Decimal('0.00')
            for prod in selected:
                qty = random.choices([1, 2, 3, 5], weights=[0.70, 0.20, 0.08, 0.02])[0]
                subtotal = qty * prod.price
                order_total += subtotal

                items_to_create.append(OrderItem(
                    order=order,
                    product=prod,
                    quantity=qty,
                    unit_price=prod.price,
                    subtotal=subtotal,
                ))

            order.total_amount = order_total

        Order.objects.bulk_update(created_orders, ['total_amount'])
        created_items = OrderItem.objects.bulk_create(items_to_create)

        return created_orders, created_items

    # ------------------------------------------------------------------
    # Reviews
    # ------------------------------------------------------------------

    def _create_reviews(self, customers, products, order_items):
        comments_by_rating = {
            5: ["Excellent! Exceeded expectations.", "Outstanding quality, highly recommended.",
                "Perfect product, fast shipping.", "Best purchase of the year."],
            4: ["Very good product, works well.", "Great value for money.",
                "Good quality, minor packaging delay.", "Solid performance."],
            3: ["Average quality, does the job.", "Decent but expected more.",
                "Okay product, not terrible.", "Fair quality for the price."],
            2: ["Disappointed. Poor quality.", "Not as described.",
                "Underperformed, quite fragile.", "Mediocre quality, overpriced."],
            1: ["Terrible! Broke on day one.", "Complete waste of money.",
                "Awful. Reached out for a refund.", "Extremely dissatisfied."],
        }
        rating_weights = [0.55, 0.25, 0.10, 0.06, 0.04]

        # Build purchase pairs for realistic reviews
        purchase_pairs = [
            (item.product, item.order.customer, item.order.order_date)
            for item in order_items
        ]

        objs = []
        for _ in range(self.REVIEW_COUNT):
            product, customer, order_date = random.choice(purchase_pairs)
            earliest = max(order_date, product.created_date, customer.joined_date)
            days_since = (date.today() - earliest).days
            review_date = earliest + timedelta(
                days=random.randint(0, max(0, days_since - 1))
            ) if days_since > 1 else earliest

            rating = random.choices([5, 4, 3, 2, 1], weights=rating_weights)[0]

            objs.append(Review(
                user=self.user,
                product=product,
                customer=customer,
                rating=rating,
                comment=random.choice(comments_by_rating[rating]),
                created_date=review_date,
            ))

        return Review.objects.bulk_create(objs)
