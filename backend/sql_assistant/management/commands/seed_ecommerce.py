import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from django.db import transaction
from faker import Faker

from ecommerce.models import Category
from sql_assistant.services.seed_user_data import UserDataSeeder

# Seed Faker for reproducibility
fake = Faker()
Faker.seed(2026)
random.seed(2026)


class Command(BaseCommand):
    help = (
        "Seeds the database. Without arguments, creates shared categories only. "
        "Use --seed-for-user <user_id> to seed ecommerce data for a specific user."
    )

    def add_arguments(self, parser):
        parser.add_argument('--seed-for-user', type=int, default=None,
                            help='Seed ecommerce data for a specific user ID')
        parser.add_argument('--skip-if-exists', action='store_true',
                            help='Skip seeding if categories already exist')

    def handle(self, *args, **options):
        user_id = options['seed_for_user']

        if user_id:
            # Seed data for a specific user
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise CommandError(f"User with ID {user_id} does not exist.")

            self.stdout.write(f"Seeding ecommerce data for user: {user.email} (id={user.id})...")
            seeder = UserDataSeeder(user)
            summary = seeder.seed()
            self.stdout.write(self.style.SUCCESS(f"Done! Seeded: {summary}"))
            return

        # Default: seed shared categories only
        if Category.objects.exists():
            if options['skip_if_exists']:
                self.stdout.write(self.style.WARNING("Categories already exist. Skipping."))
                return
            else:
                self.stdout.write(self.style.WARNING("Categories already exist. Skipping category creation."))
                return

        self.stdout.write("Creating shared categories...")
        try:
            with transaction.atomic():
                categories_data = {
                    "Electronics": ["Laptops", "Smartphones", "Audio", "Wearables"],
                    "Apparel": ["Men's Wear", "Women's Wear", "Footwear", "Accessories"],
                    "Home & Kitchen": ["Cookware", "Bedding", "Appliances", "Furniture"],
                    "Sports & Outdoors": ["Fitness", "Camping", "Cycling", "Athletic Apparel"],
                    "Books": ["Fiction", "Non-Fiction", "Self-Help", "Children's Books"]
                }

                total = 0
                for parent_name, children in categories_data.items():
                    parent = Category.objects.create(
                        name=parent_name,
                        description=f"Quality products in {parent_name} category."
                    )
                    total += 1

                    for child_name in children:
                        Category.objects.create(
                            name=child_name,
                            parent_category=parent,
                            description=f"Explore premium {child_name} accessories and gear."
                        )
                        total += 1

                self.stdout.write(self.style.SUCCESS(f"Created {total} categories (parent + child)."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Category seeding failed: {str(e)}"))
            raise e

        self.stdout.write(self.style.SUCCESS(
            "=== SEEDING COMPLETE ===\n"
            "Shared categories created. User-specific data is auto-seeded at signup.\n"
            "Use --seed-for-user <user_id> to manually seed data for an existing user."
        ))
