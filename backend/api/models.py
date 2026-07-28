from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('school_admin', 'School Admin'),
        ('teacher', 'Teacher'),
        ('district_official', 'District Official'),
        ('ministry_official', 'Ministry Official'),
    ]

    username = None
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='teacher')
    school = models.ForeignKey('School', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    district = models.CharField(max_length=100, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"


class School(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('suspended', 'Suspended'),
    ]

    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True)
    emis_code = models.CharField(max_length=50, blank=True, null=True)
    district = models.CharField(max_length=100)
    sub_county = models.CharField(max_length=100, blank=True, null=True)
    parish = models.CharField(max_length=100, blank=True, null=True)
    level = models.CharField(max_length=50, default='Primary')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Learner(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female')]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('dropped', 'Dropped'),
        ('transferred', 'Transferred'),
        ('completed', 'Completed'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='learners')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    learner_id = models.CharField(max_length=30, unique=True)
    class_level = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    guardian_name = models.CharField(max_length=200, blank=True, null=True)
    guardian_phone = models.CharField(max_length=15, blank=True, null=True)
    has_disability = models.BooleanField(default=False)
    disability_type = models.CharField(max_length=100, blank=True, null=True)
    disability_accommodations = models.TextField(blank=True, null=True)
    is_refugee = models.BooleanField(default=False)
    refugee_id = models.CharField(max_length=50, blank=True, null=True)
    pregnancy_flag = models.BooleanField(default=False)
    pregnancy_due_date = models.DateField(null=True, blank=True)
    expected_return_date = models.DateField(null=True, blank=True)
    enrollment_date = models.DateField(default=timezone.now)
    dropout_date = models.DateField(null=True, blank=True)
    dropout_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['school', 'status']),
            models.Index(fields=['learner_id']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.learner_id})"


class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='teachers')
    qualifications = models.TextField(blank=True, null=True)
    subjects = models.JSONField(default=list)
    is_deployed = models.BooleanField(default=True)
    deployment_preference = models.JSONField(default=list)
    badges = models.JSONField(default=list)
    hire_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"Teacher {self.user.get_full_name()}"


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now=True)
    sync_status = models.CharField(max_length=20, default='synced')

    class Meta:
        unique_together = ['learner', 'date']
        indexes = [models.Index(fields=['school', 'date'])]


class TeacherAttendance(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    check_in = models.DateTimeField()
    check_out = models.DateTimeField(null=True, blank=True)
    check_in_lat = models.FloatField(null=True, blank=True)
    check_in_lon = models.FloatField(null=True, blank=True)

    class Meta:
        ordering = ['-check_in']


class Marks(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    learner = models.ForeignKey(Learner, on_delete=models.CASCADE, related_name='marks')
    subject = models.CharField(max_length=100)
    assessment_type = models.CharField(max_length=50)
    score = models.FloatField()
    max_score = models.FloatField(default=100)
    term = models.CharField(max_length=20)
    academic_year = models.CharField(max_length=10)
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['learner', 'term', 'academic_year'])]


class FinanceRecord(models.Model):
    TYPE_CHOICES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
    ]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='finances')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    receipt = models.ImageField(upload_to='receipts/', null=True, blank=True)
    grant_reference = models.CharField(max_length=100, blank=True, null=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)


class Infrastructure(models.Model):
    CONDITION_CHOICES = [(1, 'Poor'), (2, 'Fair'), (3, 'Good'), (4, 'Very Good'), (5, 'Excellent')]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='infrastructure')
    type = models.CharField(max_length=50)
    name = models.CharField(max_length=100)
    capacity = models.IntegerField(default=0)
    condition = models.IntegerField(choices=CONDITION_CHOICES, default=3)
    has_water = models.BooleanField(default=False)
    has_mhm = models.BooleanField(default=False)
    mhm_features = models.JSONField(default=dict)
    notes = models.TextField(blank=True, null=True)
    last_inspected = models.DateField(null=True, blank=True)


class Incident(models.Model):
    URGENCY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')]

    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='incidents')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    is_anonymous = models.BooleanField(default=False)
    type = models.CharField(max_length=50)
    description = models.TextField()
    urgency = models.CharField(max_length=10, choices=URGENCY_CHOICES, default='medium')
    status = models.CharField(max_length=20, default='open')
    response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)


class ActivityLog(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=200)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
