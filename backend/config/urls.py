from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    path('', TemplateView.as_view(template_name='pages/login.html'), name='login'),
    path('admin/', admin.site.urls),
]
