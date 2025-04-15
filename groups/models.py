
from django.db import models
from django.conf import settings

class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    target_amount = models.DecimalField(max_digits=10, decimal_places=2)
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='administered_groups'
    )
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='member_groups')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
