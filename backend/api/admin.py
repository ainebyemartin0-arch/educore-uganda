from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, School, Learner, Teacher, Attendance,
    TeacherAttendance, Marks, FinanceRecord,
    Infrastructure, Incident, ActivityLog
)


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'school', 'is_active']
    list_filter = ['role', 'is_active', 'school']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['email']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Role & School', {'fields': ('role', 'school', 'district')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2', 'role', 'school'),
        }),
    )


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'district', 'level', 'status', 'created_at']
    list_filter = ['status', 'level', 'district']
    search_fields = ['name', 'code', 'emis_code']


@admin.register(Learner)
class LearnerAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'learner_id', 'school', 'class_level', 'status', 'gender']
    list_filter = ['status', 'gender', 'class_level', 'school']
    search_fields = ['first_name', 'last_name', 'learner_id']


@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'school', 'is_deployed']
    list_filter = ['is_deployed', 'school']


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['learner', 'date', 'status', 'school']
    list_filter = ['status', 'date', 'school']


@admin.register(Marks)
class MarksAdmin(admin.ModelAdmin):
    list_display = ['learner', 'subject', 'score', 'term', 'academic_year']


@admin.register(FinanceRecord)
class FinanceRecordAdmin(admin.ModelAdmin):
    list_display = ['school', 'type', 'category', 'amount', 'date']


@admin.register(Infrastructure)
class InfrastructureAdmin(admin.ModelAdmin):
    list_display = ['school', 'type', 'name', 'condition', 'has_water']


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ['school', 'type', 'urgency', 'status', 'created_at']
    list_filter = ['urgency', 'status']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'school', 'created_at']
