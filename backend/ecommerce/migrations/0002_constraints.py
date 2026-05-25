from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ecommerce', '0001_initial'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='customer',
            constraint=models.CheckConstraint(
                check=models.Q(('tier__in', ['bronze', 'silver', 'gold'])),
                name='customers_tier_valid',
            ),
        ),
        migrations.AddConstraint(
            model_name='product',
            constraint=models.CheckConstraint(
                check=models.Q(('price__gte', 0)),
                name='products_price_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='product',
            constraint=models.CheckConstraint(
                check=models.Q(('stock_qty__gte', 0)),
                name='products_stock_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='order',
            constraint=models.CheckConstraint(
                check=models.Q(('status__in', ['pending', 'shipped', 'delivered', 'cancelled'])),
                name='orders_status_valid',
            ),
        ),
        migrations.AddConstraint(
            model_name='order',
            constraint=models.CheckConstraint(
                check=models.Q(('total_amount__gte', 0)),
                name='orders_total_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='orderitem',
            constraint=models.CheckConstraint(
                check=models.Q(('quantity__gt', 0)),
                name='order_items_quantity_positive',
            ),
        ),
        migrations.AddConstraint(
            model_name='orderitem',
            constraint=models.CheckConstraint(
                check=models.Q(('unit_price__gte', 0)),
                name='order_items_unit_price_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='orderitem',
            constraint=models.CheckConstraint(
                check=models.Q(('subtotal__gte', 0)),
                name='order_items_subtotal_non_negative',
            ),
        ),
        migrations.AddConstraint(
            model_name='review',
            constraint=models.CheckConstraint(
                check=models.Q(('rating__gte', 1), ('rating__lte', 5)),
                name='reviews_rating_between_1_and_5',
            ),
        ),
    ]
