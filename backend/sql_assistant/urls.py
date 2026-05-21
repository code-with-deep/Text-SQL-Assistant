from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sql_assistant.views import (
    SchemaViewSet,
    QueryViewSet,
    HistoryViewSet,
    ExportView,
    HealthView
)

# Use DRF DefaultRouter for ViewSets
router = DefaultRouter()
router.register(r'schema', SchemaViewSet, basename='schema')
router.register(r'query', QueryViewSet, basename='query')
router.register(r'history', HistoryViewSet, basename='history')

urlpatterns = [
    # Include router URLs
    path('', include(router.urls)),
    
    # Standalone API Views
    path('export/', ExportView.as_view(), name='export'),
    path('health/', HealthView.as_view(), name='health'),
]
