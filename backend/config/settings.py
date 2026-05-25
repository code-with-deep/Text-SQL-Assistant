import os
from pathlib import Path

from decouple import AutoConfig, Csv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if it exists, otherwise fall back to system environment variables
config = AutoConfig(search_path=BASE_DIR)

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('DJANGO_SECRET_KEY', default='insecure-dev-key-change-in-production')

# Dedicated secret key for JWT signing
JWT_SECRET_KEY = config('JWT_SECRET_KEY', default=SECRET_KEY)

DEBUG = config('DJANGO_DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('DJANGO_ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0', cast=Csv())

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'ecommerce',
    'sql_assistant',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

import dj_database_url

is_supabase_pooler = 'pooler.supabase' in config('DATABASE_URL', default='')

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default=''),
        conn_max_age=0 if is_supabase_pooler else 600,
        conn_health_checks=True,
        ssl_require=config('DATABASE_URL', default='').startswith('postgres'),
    ),
}
if DATABASES['default'].get('ENGINE') == 'django.db.backends.postgresql':
    DATABASES['default']['OPTIONS'] = DATABASES['default'].get('OPTIONS', {})
    DATABASES['default']['OPTIONS']['prepare_threshold'] = None

# The backend will default to the primary DB. If READONLY_DATABASE_URL is provided, it uses that instead.
DATABASES['readonly'] = dj_database_url.config(
    default=config('READONLY_DATABASE_URL', default=config('DATABASE_URL', default='')),
    conn_max_age=0 if is_supabase_pooler else 600,
    conn_health_checks=True,
    ssl_require=config('READONLY_DATABASE_URL', default=config('DATABASE_URL', default='')).startswith('postgres'),
)
if DATABASES['readonly'].get('ENGINE') == 'django.db.backends.postgresql':
    DATABASES['readonly']['OPTIONS'] = DATABASES['readonly'].get('OPTIONS', {})
    DATABASES['readonly']['OPTIONS']['prepare_threshold'] = None

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'sql_assistant.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': f'{config("RATE_LIMIT_PER_MIN", default=30, cast=int)}/min',
        'user': f'{config("RATE_LIMIT_PER_MIN", default=30, cast=int)}/min',
    },
    'EXCEPTION_HANDLER': 'sql_assistant.views.custom_exception_handler',
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'schema-cache',
        'TIMEOUT': config('SCHEMA_CACHE_TTL', default=3600, cast=int),
    },
}

GROQ_API_KEY = config('GROQ_API_KEY', default='')
GROQ_MODEL = 'llama-3.3-70b-versatile'

MAX_QUERY_ROWS = config('MAX_QUERY_ROWS', default=1000, cast=int)
QUERY_TIMEOUT_SECONDS = config('QUERY_TIMEOUT_SECONDS', default=10, cast=int)
LLM_MAX_RETRIES = config('LLM_MAX_RETRIES', default=2, cast=int)
SCHEMA_CACHE_TTL = config('SCHEMA_CACHE_TTL', default=3600, cast=int)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'sql_assistant': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
