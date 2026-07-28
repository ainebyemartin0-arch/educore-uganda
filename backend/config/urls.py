from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from api import views

router = DefaultRouter()
router.register(r'schools', views.SchoolViewSet, basename='school')
router.register(r'learners', views.LearnerViewSet, basename='learner')
router.register(r'attendance', views.AttendanceViewSet, basename='attendance')
router.register(r'marks', views.MarksViewSet, basename='marks')
router.register(r'finances', views.FinanceViewSet, basename='finance')
router.register(r'infrastructure', views.InfrastructureViewSet, basename='infrastructure')
router.register(r'incidents', views.IncidentViewSet, basename='incident')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API
    path('api/v1/', include(router.urls)),
    path('api/v1/auth/login/', views.login_view, name='login'),
    path('api/v1/auth/logout/', views.logout_view, name='logout'),
    path('api/v1/auth/me/', views.me_view, name='me'),
    path('api/v1/school-dashboard/', views.school_dashboard_stats, name='school-dashboard'),
    path('api/v1/super-admin/stats/', views.super_admin_stats, name='super-admin-stats'),
    
    # Frontend pages
    path('', TemplateView.as_view(template_name='pages/login.html'), name='login-page'),
    path('login/', TemplateView.as_view(template_name='pages/login.html'), name='login-alt'),
]
