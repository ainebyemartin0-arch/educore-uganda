from django.http import JsonResponse
from django.db import connection


class TenantMiddleware:
    """
    Extracts tenant context from request headers and sets it for the request.
    Works with the X-Tenant-ID header sent from the frontend.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Extract tenant from header
        tenant_id = request.headers.get('X-Tenant-ID')
        
        if tenant_id:
            request.tenant_id = tenant_id
        else:
            request.tenant_id = None

        response = self.get_response(request)
        return response
