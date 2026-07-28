from rest_framework import serializers
from .models import (
    User, School, Learner, Teacher, Attendance,
    TeacherAttendance, Marks, FinanceRecord,
    Infrastructure, Incident, ActivityLog
)
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'district', 'school']
        read_only_fields = ['id']


class LoginSerializer(serializers.Serializer):
    school_code = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        # Find school by code
        try:
            school = School.objects.get(code=data['school_code'])
        except School.DoesNotExist:
            raise serializers.ValidationError('Invalid school code.')

        # Authenticate user
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')

        # Verify user belongs to this school (or is super admin)
        if user.role not in ['super_admin', 'ministry_official']:
            if user.school != school:
                raise serializers.ValidationError('User does not belong to this school.')

        return {
            'user': user,
            'school': school
        }


class SchoolSerializer(serializers.ModelSerializer):
    learner_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()

    class Meta:
        model = School
        fields = '__all__'

    def get_learner_count(self, obj):
        return obj.learners.filter(status='active').count()

    def get_teacher_count(self, obj):
        return obj.teachers.filter(is_deployed=True).count()


class LearnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Learner
        fields = '__all__'
        read_only_fields = ['learner_id', 'created_at']


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = '__all__'


class MarksSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marks
        fields = '__all__'


class FinanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinanceRecord
        fields = '__all__'


class InfrastructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Infrastructure
        fields = '__all__'


class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = '__all__'
