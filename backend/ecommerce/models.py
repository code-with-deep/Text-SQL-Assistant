from django.conf import settings
from django.db import models


class Category(models.Model):
    """Shared/global categories — no user_id. All users reference the same set."""
    name = models.CharField(max_length=100)
    parent_category = models.ForeignKey(
        'self', null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='subcategories',
    )
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Customer(models.Model):
    TIER_CHOICES = [
        ('bronze', 'Bronze'),
        ('silver', 'Silver'),
        ('gold', 'Gold'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.CASCADE, related_name='ecom_customers',
        db_index=True,
    )
    name = models.CharField(max_length=200)
    email = models.EmailField()
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default='bronze')
    joined_date = models.DateField()

    class Meta:
        db_table = 'customers'
        ordering = ['-joined_date']
        constraints = [
            models.CheckConstraint(
                check=models.Q(tier__in=['bronze', 'silver', 'gold']),
                name='customers_tier_valid',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'tier']),
            models.Index(fields=['user', 'country']),
            models.Index(fields=['user', 'joined_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.tier})"


class Product(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.CASCADE, related_name='ecom_products',
        db_index=True,
    )
    name = models.CharField(max_length=200)
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name='products',
    )
    brand = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_qty = models.IntegerField(default=0)
    created_date = models.DateField()

    class Meta:
        db_table = 'products'
        ordering = ['name']
        constraints = [
            models.CheckConstraint(check=models.Q(price__gte=0), name='products_price_non_negative'),
            models.CheckConstraint(check=models.Q(stock_qty__gte=0), name='products_stock_non_negative'),
        ]
        indexes = [
            models.Index(fields=['user', 'category']),
            models.Index(fields=['user', 'price']),
            models.Index(fields=['user', 'created_date']),
        ]

    def __str__(self):
        return f"{self.name} — ${self.price}"


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.CASCADE, related_name='ecom_orders',
        db_index=True,
    )
    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name='orders',
    )
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'orders'
        ordering = ['-order_date']
        constraints = [
            models.CheckConstraint(
                check=models.Q(status__in=['pending', 'shipped', 'delivered', 'cancelled']),
                name='orders_status_valid',
            ),
            models.CheckConstraint(check=models.Q(total_amount__gte=0), name='orders_total_non_negative'),
        ]
        indexes = [
            models.Index(fields=['user', 'customer']),
            models.Index(fields=['user', 'order_date']),
            models.Index(fields=['user', 'status']),
        ]

    def __str__(self):
        return f"Order #{self.pk} — {self.customer.name}"


class OrderItem(models.Model):
    """Inherits user scope through its parent Order — no direct user FK needed."""
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items',
    )
    product = models.ForeignKey(
        Product, on_delete=models.PROTECT, related_name='order_items',
    )
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'order_items'
        constraints = [
            models.CheckConstraint(check=models.Q(quantity__gt=0), name='order_items_quantity_positive'),
            models.CheckConstraint(check=models.Q(unit_price__gte=0), name='order_items_unit_price_non_negative'),
            models.CheckConstraint(check=models.Q(subtotal__gte=0), name='order_items_subtotal_non_negative'),
        ]
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['product']),
        ]

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} x{self.quantity}"


class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.CASCADE, related_name='ecom_reviews',
        db_index=True,
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='reviews',
    )
    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='reviews',
    )
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    created_date = models.DateField()

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_date']
        constraints = [
            models.CheckConstraint(check=models.Q(rating__gte=1, rating__lte=5), name='reviews_rating_between_1_and_5'),
        ]
        indexes = [
            models.Index(fields=['user', 'product']),
            models.Index(fields=['user', 'customer']),
            models.Index(fields=['user', 'rating']),
        ]

    def __str__(self):
        return f"Review by {self.customer.name} — {self.rating}/5"
