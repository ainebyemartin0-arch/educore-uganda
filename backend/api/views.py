from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta

from .models import (
    User, School, Learner, Teacher, Attendance,
    TeacherAttendance, Marks, FinanceRecord,
    Infrastructure, Incident, ActivityLog
)
from .serializers import (
    UserSerializer, LoginSerializer, SchoolSerializer,
    LearnerSerializer, AttendanceSerializer, MarksSerializer,
    FinanceSerializer, InfrastructureSerializer, IncidentSerializer
)


# ===== AUTH VIEWS =====

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data
    })


@api_view(['POST'])
def logout_view(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
    except:
        pass
    return Response({'message': 'Logged out'})


@api_view(['GET'])
def me_view(request):
    return Response(UserSerializer(request.user).data)


# ===== SCHOOL VIEWS =====

class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return School.objects.all()
        if user.school:
            return School.objects.filter(id=user.school.id)
        return School.objects.none()


# ===== LEARNER VIEWS =====

class LearnerViewSet(viewsets.ModelViewSet):
    serializer_class = LearnerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school:
            return Learner.objects.filter(school=user.school)
        return Learner.objects.none()

    def perform_create(self, serializer):
        school = self.request.user.school
        # Generate learner ID
        count = Learner.objects.filter(school=school).count() + 1
        learner_id = f"{school.code}-{count:04d}"
        serializer.save(school=school, learner_id=learner_id)


# ===== ATTENDANCE VIEWS =====

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school:
            return Attendance.objects.filter(school=user.school)
        return Attendance.objects.none()

    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            recorded_by=self.request.user
        )


# ===== MARKS VIEWS =====

class MarksViewSet(viewsets.ModelViewSet):
    serializer_class = MarksSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school:
            return Marks.objects.filter(school=user.school)
        return Marks.objects.none()


# ===== FINANCE VIEWS =====

class FinanceViewSet(viewsets.ModelViewSet):
    serializer_class = FinanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school:
            return FinanceRecord.objects.filter(school=user.school)
        return FinanceRecord.objects.none()


# ===== INFRASTRUCTURE VIEWS =====

class InfrastructureViewSet(viewsets.ModelViewSet):
    serializer_class = InfrastructureSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.school:
            return Infrastructure.objects.filter(school=user.school)
        return Infrastructure.objects.none()


# ===== INCIDENT VIEWS =====

class IncidentViewSet(viewsets.ModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['super_admin', 'district_official']:
            return Incident.objects.all()
        if user.school:
            return Incident.objects.filter(school=user.school)
        return Incident.objects.none()


# ===== DASHBOARD STATS =====

@api_view(['GET'])
def school_dashboard_stats(request):
    user = request.user
    school = user.school
    today = timezone.now().date()
    
    if not school:
        return Response({'error': 'No school assigned'}, status=400)
    
    total_learners = Learner.objects.filter(school=school, status='active').count()
    today_attendance = Attendance.objects.filter(school=school, date=today).count()
    total_active = Learner.objects.filter(school=school, status='active').count()
    attendance_rate = round((today_attendance / total_active * 100)) if total_active > 0 else 0
    
    # Dropout alerts (3+ consecutive absences in last 7 days)
    week_ago = today - timedelta(days=7)
    dropout_risk = 0
    learners = Learner.objects.filter(school=school, status='active')
    for learner in learners:
        recent_absences = Attendance.objects.filter(
            learner=learner,
            date__gte=week_ago,
            status='absent'
        ).count()
        if recent_absences >= 3:
            dropout_risk += 1
    
    return Response({
        'total_learners': total_learners,
        'today_attendance': f"{attendance_rate}%",
        'teachers_present': Teacher.objects.filter(school=school, is_deployed=True).count(),
        'dropout_alerts': dropout_risk,
    })


@api_view(['GET'])
def super_admin_stats(request):
    total_schools = School.objects.count()
    total_learners = Learner.objects.filter(status='active').count()
    pending_onboarding = School.objects.filter(status='pending').count()
    
    return Response({
        'total_schools': total_schools,
        'total_learners': total_learners,
        'pending_onboarding': pending_onboarding,
        'system_uptime': '99.8%',
        'school_trend': f'+{School.objects.filter(created_at__gte=timezone.now()-timedelta(days=30)).count()} this month',
    })
