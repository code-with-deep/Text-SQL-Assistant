from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

from sql_assistant.auth_tokens import TokenError, decode_token


class JWTAuthentication(authentication.BaseAuthentication):
    keyword = 'Bearer'

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0] != self.keyword:
            raise exceptions.AuthenticationFailed('Invalid authorization header')

        try:
            payload = decode_token(parts[1], expected_type='access')
        except TokenError as exc:
            raise exceptions.AuthenticationFailed(str(exc)) from exc

        User = get_user_model()
        try:
            user = User.objects.get(id=payload['sub'], is_active=True)
        except User.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed('User not found') from exc

        return user, payload
