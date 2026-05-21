from django.db import models


class Category(models.Model):
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

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    tier = models.CharField(max_length=10, choices=TIER_CHOICES, default='bronze')
    joined_date = models.DateField()

    class Meta:
        db_table = 'customers'
        ordering = ['-joined_date']
        indexes = [
            models.Index(fields=['tier']),
            models.Index(fields=['country']),
            models.Index(fields=['joined_date']),
        ]

    def __str__(self):
        return f"{self.name} ({self.tier})"


class Product(models.Model):
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
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['price']),
            models.Index(fields=['created_date']),
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

    customer = models.ForeignKey(
        Customer, on_delete=models.PROTECT, related_name='orders',
    )
    order_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'orders'
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['customer']),
            models.Index(fields=['order_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Order #{self.pk} — {self.customer.name}"


class OrderItem(models.Model):
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
        indexes = [
            models.Index(fields=['product']),
            models.Index(fields=['customer']),
            models.Index(fields=['rating']),
        ]

    def __str__(self):
        return f"Review by {self.customer.name} — {self.rating}/5"
