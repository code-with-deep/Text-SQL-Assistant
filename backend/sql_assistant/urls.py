from django.urls import path, include
from rest_framework.routers import DefaultRouter
from sql_assistant.views import (
    RegisterView,
    LoginView,
    RefreshTokenView,
    LogoutView,
    MeView,
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

    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='auth-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', MeView.as_view(), name='auth-me'),
    
    # Standalone API Views
    path('export/', ExportView.as_view(), name='export'),
    path('health/', HealthView.as_view(), name='health'),
]
