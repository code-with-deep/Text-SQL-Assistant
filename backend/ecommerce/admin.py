from django.contrib import admin
from ecommerce.models import Category, Customer, Product, Order, OrderItem, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_category', 'description')
    list_filter = ('parent_category',)
    search_fields = ('name',)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'city', 'country', 'tier', 'joined_date')
    list_filter = ('tier', 'country')
    search_fields = ('name', 'email', 'city')
    date_hierarchy = 'joined_date'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'brand', 'price', 'stock_qty', 'created_date')
    list_filter = ('category', 'brand')
    search_fields = ('name', 'brand')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'order_date', 'status', 'total_amount')
    list_filter = ('status', 'order_date')
    search_fields = ('customer__name',)
    date_hierarchy = 'order_date'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'unit_price', 'subtotal')
    list_filter = ('product__category',)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'customer', 'rating', 'created_date')
    list_filter = ('rating',)
    search_fields = ('product__name', 'customer__name')
