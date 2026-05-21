import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from faker import Faker

from ecommerce.models import Category, Customer, Product, Order, OrderItem, Review

# Seed Faker for reproducibility
fake = Faker()
Faker.seed(2026)
random.seed(2026)


class Command(BaseCommand):
    help = "Seeds the PostgreSQL database with 10K+ highly realistic, statistically coherent e-commerce records."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Clearing existing data..."))
        
        # Disable foreign key checks or clear in dependency order
        Review.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        Product.objects.all().delete()
        Customer.objects.all().delete()
        Category.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("Database cleared. Starting seeding process..."))

        try:
            with transaction.atomic():
                # 1. Seed Categories (15-20)
                categories_data = {
                    "Electronics": ["Laptops", "Smartphones", "Audio", "Wearables"],
                    "Apparel": ["Men's Wear", "Women's Wear", "Footwear", "Accessories"],
                    "Home & Kitchen": ["Cookware", "Bedding", "Appliances", "Furniture"],
                    "Sports & Outdoors": ["Fitness", "Camping", "Cycling", "Athletic Apparel"],
                    "Books": ["Fiction", "Non-Fiction", "Self-Help", "Children's Books"]
                }
                
                categories_map = {}
                all_cats = []
                
                for parent_name, children in categories_data.items():
                    parent = Category.objects.create(
                        name=parent_name,
                        description=f"Quality products in {parent_name} category."
                    )
                    categories_map[parent_name] = parent
                    all_cats.append(parent)
                    
                    for child_name in children:
                        child = Category.objects.create(
                            name=child_name,
                            parent_category=parent,
                            description=f"Explore premium {child_name} accessories and gear."
                        )
                        categories_map[child_name] = child
                        all_cats.append(child)
                
                self.stdout.write(f"Created {len(all_cats)} categories (parent + child subcategories).")

                # 2. Seed Customers (500+)
                cities_by_country = {
                    "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Seattle", "Austin"],
                    "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
                    "France": ["Paris", "Lyon", "Marseille"],
                    "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg"],
                    "Japan": ["Tokyo", "Osaka", "Kyoto"],
                    "Australia": ["Sydney", "Melbourne", "Brisbane"]
                }
                
                countries = list(cities_by_country.keys())
                tiers = ['bronze', 'silver', 'gold']
                tier_weights = [0.65, 0.25, 0.10]  # Standard distribution
                
                customers_to_create = []
                start_join_date = date.today() - timedelta(days=730)  # Past 2 years
                
                unique_emails = set()
                while len(customers_to_create) < 550:
                    name = fake.name()
                    email = fake.unique.email()
                    if email in unique_emails:
                        continue
                    unique_emails.add(email)
                    
                    country = random.choice(countries)
                    city = random.choice(cities_by_country[country])
                    tier = random.choices(tiers, weights=tier_weights)[0]
                    joined_date = start_join_date + timedelta(days=random.randint(0, 700))
                    
                    customers_to_create.append(
                        Customer(
                            name=name,
                            email=email,
                            city=city,
                            country=country,
                            tier=tier,
                            joined_date=joined_date
                        )
                    )
                
                created_customers = Customer.objects.bulk_create(customers_to_create)
                self.stdout.write(f"Successfully bulk-created {len(created_customers)} customers.")

                # 3. Seed Products (200+)
                brands = ["TechCorp", "ApexGear", "SleekStyles", "EcoKitchen", "AuraSound", "VeloSports", "ReadPulse"]
                products_to_create = []
                
                # Assign products to child subcategories
                child_categories = [c for c in all_cats if c.parent_category is not None]
                
                for i in range(220):
                    cat = random.choice(child_categories)
                    brand = random.choice(brands)
                    
                    # Statistical pricing distributions
                    if cat.parent_category.name == "Electronics":
                        price = round(random.uniform(99.00, 1499.00), 2)
                    elif cat.parent_category.name == "Apparel":
                        price = round(random.uniform(19.99, 149.99), 2)
                    elif cat.parent_category.name == "Home & Kitchen":
                        price = round(random.uniform(25.00, 499.00), 2)
                    else:
                        price = round(random.uniform(9.99, 89.99), 2)
                        
                    stock_qty = random.randint(5, 450)
                    # Create realistic creation dates within the past 2 years
                    created_date = start_join_date + timedelta(days=random.randint(0, 300))
                    
                    # Synthesize product name
                    prod_name = f"{brand} Premium {cat.name} v{random.randint(1, 9)}"
                    
                    products_to_create.append(
                        Product(
                            name=prod_name,
                            category=cat,
                            brand=brand,
                            price=price,
                            stock_qty=stock_qty,
                            created_date=created_date
                        )
                    )
                
                created_products = Product.objects.bulk_create(products_to_create)
                self.stdout.write(f"Successfully bulk-created {len(created_products)} products.")

                # 4. Seed Orders (5,000+) & OrderItems (10,000+)
                statuses = ['pending', 'shipped', 'delivered', 'cancelled']
                status_weights = [0.05, 0.15, 0.75, 0.05]
                
                orders_to_create = []
                order_items_to_create = []
                
                # We need chronological ordering distribution
                order_date_range = 710  # days
                
                self.stdout.write("Generating orders and items (this takes a moment)...")
                
                # Pre-calculate customer active periods (cannot order before joining)
                customer_joined_dates = {c.id: c.joined_date for c in created_customers}
                
                for i in range(5100):
                    customer = random.choice(created_customers)
                    cust_joined = customer_joined_dates[customer.id]
                    
                    # Order date must be after joined date
                    days_since_joined = (date.today() - cust_joined).days
                    if days_since_joined <= 1:
                        order_date = cust_joined
                    else:
                        order_date = cust_joined + timedelta(days=random.randint(0, days_since_joined - 1))
                    
                    status = random.choices(statuses, weights=status_weights)[0]
                    
                    # Temporary total amount placeholder, will update after items
                    orders_to_create.append(
                        Order(
                            customer=customer,
                            order_date=order_date,
                            status=status,
                            total_amount=0.00  # Will back-calculate
                        )
                    )
                
                created_orders = Order.objects.bulk_create(orders_to_create)
                
                # Create OrderItems mapping to created orders
                for order in created_orders:
                    # Pick 1-4 products randomly for this order
                    num_items = random.choices([1, 2, 3, 4], weights=[0.50, 0.30, 0.15, 0.05])[0]
                    selected_products = random.sample(created_products, num_items)
                    
                    order_total = 0
                    for prod in selected_products:
                        qty = random.choices([1, 2, 3, 5], weights=[0.70, 0.20, 0.08, 0.02])[0]
                        unit_price = prod.price
                        subtotal = qty * unit_price
                        order_total += subtotal
                        
                        order_items_to_create.append(
                            OrderItem(
                                order=order,
                                product=prod,
                                quantity=qty,
                                unit_price=unit_price,
                                subtotal=subtotal
                            )
                        )
                    
                    # Update order total_amount locally in memory
                    order.total_amount = order_total
                
                # Bulk update order total amounts (highly efficient)
                Order.objects.bulk_update(created_orders, ['total_amount'])
                self.stdout.write(f"Updated total pricing values for all {len(created_orders)} orders.")
                
                # Bulk create items
                created_items = OrderItem.objects.bulk_create(order_items_to_create)
                self.stdout.write(f"Successfully bulk-created {len(created_items)} order items.")

                # 5. Seed Reviews (2,000+)
                reviews_to_create = []
                comments_by_rating = {
                    5: ["Excellent! Exceeded expectations.", "Outstanding quality, highly recommended.", "Perfect product, fast shipping.", "Best purchase of the year."],
                    4: ["Very good product, works well.", "Great value for money, happy with it.", "Good quality, minor packaging delay.", "Solid performance."],
                    3: ["Average quality, does the job.", "Decent but expected slightly more.", "Okay product, not terrible.", "Fair quality for the price."],
                    2: ["Disappointed. Poor quality.", "Not as described, wouldn't buy again.", "Underperformed, quite fragile.", "Mediocre quality, overpriced."],
                    1: ["Terrible! Broke on day one.", "Complete waste of money, do not buy.", "Awful. Reached out for a refund.", "Extremely dissatisfied."]
                }
                
                rating_choices = [5, 4, 3, 2, 1]
                rating_weights = [0.55, 0.25, 0.10, 0.06, 0.04]  # Positive skew typical in e-commerce
                
                # Pre-calculate active period for reviews (must review after order)
                # Let's link them to customers who ordered
                for i in range(2150):
                    product = random.choice(created_products)
                    customer = random.choice(created_customers)
                    
                    # Pick review date
                    max_joined = max(customer.joined_date, product.created_date)
                    days_since_active = (date.today() - max_joined).days
                    if days_since_active <= 1:
                        review_date = max_joined
                    else:
                        review_date = max_joined + timedelta(days=random.randint(0, days_since_active - 1))
                        
                    rating = random.choices(rating_choices, weights=rating_weights)[0]
                    comment = random.choice(comments_by_rating[rating])
                    
                    reviews_to_create.append(
                        Review(
                            product=product,
                            customer=customer,
                            rating=rating,
                            comment=comment,
                            created_date=review_date
                        )
                    )
                
                created_reviews = Review.objects.bulk_create(reviews_to_create)
                self.stdout.write(f"Successfully bulk-created {len(created_reviews)} customer reviews.")

            self.stdout.write(self.style.SUCCESS("=== SEEDING PROCESS COMPLETED SUCCESSFULY ==="))
            self.stdout.write(f"Database contains:")
            self.stdout.write(f"- {Category.objects.count()} Categories")
            self.stdout.write(f"- {Customer.objects.count()} Customers")
            self.stdout.write(f"- {Product.objects.count()} Products")
            self.stdout.write(f"- {Order.objects.count()} Orders")
            self.stdout.write(f"- {OrderItem.objects.count()} OrderItems")
            self.stdout.write(f"- {Review.objects.count()} Reviews")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Seeding failed: {str(e)}"))
            raise e
