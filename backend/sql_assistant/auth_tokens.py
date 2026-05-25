import base64
import hashlib
import hmac
import json
from datetime import timedelta

from django.conf import settings
from django.utils import timezone


ACCESS_TOKEN_TTL = timedelta(minutes=15)
REFRESH_TOKEN_TTL = timedelta(days=7)


class TokenError(Exception):
    pass


def create_token(user, token_type='access'):
    ttl = ACCESS_TOKEN_TTL if token_type == 'access' else REFRESH_TOKEN_TTL
    now = timezone.now()
    payload = {
        'sub': str(user.id),
        'typ': token_type,
        'iat': int(now.timestamp()),
        'exp': int((now + ttl).timestamp()),
        'email': user.email,
        'name': user.get_full_name() or user.username,
    }
    return _encode(payload)


def decode_token(token, expected_type='access'):
    try:
        header_part, payload_part, signature_part = token.split('.')
    except ValueError as exc:
        raise TokenError('Invalid token format') from exc

    signed_part = f'{header_part}.{payload_part}'.encode()
    expected_signature = _sign(signed_part)
    if not hmac.compare_digest(signature_part, expected_signature):
        raise TokenError('Invalid token signature')

    try:
        payload = json.loads(_b64decode(payload_part))
    except (json.JSONDecodeError, ValueError) as exc:
        raise TokenError('Invalid token payload') from exc

    if payload.get('typ') != expected_type:
        raise TokenError('Invalid token type')

    if int(payload.get('exp', 0)) < int(timezone.now().timestamp()):
        raise TokenError('Token has expired')

    return payload


def _encode(payload):
    header = {'alg': 'HS256', 'typ': 'JWT'}
    header_part = _b64encode(json.dumps(header, separators=(',', ':')).encode())
    payload_part = _b64encode(json.dumps(payload, separators=(',', ':')).encode())
    signed_part = f'{header_part}.{payload_part}'.encode()
    signature = _sign(signed_part)
    return f'{header_part}.{payload_part}.{signature}'


def _sign(value):
    digest = hmac.new(settings.JWT_SECRET_KEY.encode(), value, hashlib.sha256).digest()
    return _b64encode(digest)


def _b64encode(value):
    return base64.urlsafe_b64encode(value).rstrip(b'=').decode()


def _b64decode(value):
    padding = '=' * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode())
