
from django.db import models
from django.conf import settings
from groups.models import Group

class Transaction(models.Model):
    CONTRIBUTION = 'contribution'
    WITHDRAWAL = 'withdrawal'
    
    TRANSACTION_TYPES = [
        (CONTRIBUTION, 'Contribution'),
        (WITHDRAWAL, 'Withdrawal'),
    ]
    
    PENDING = 'pending'
    APPROVED = 'approved'
    REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (APPROVED, 'Approved'),
        (REJECTED, 'Rejected'),
    ]
    
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=12, choices=TRANSACTION_TYPES)
    status = models.CharField(max_length=8, choices=STATUS_CHOICES, default=PENDING)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_type_display()} of {self.amount} by {self.user.username}"
