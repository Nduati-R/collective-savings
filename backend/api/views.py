from rest_framework import generics, status, permissions
from rest_framework.response import Response
from .models import Member
from .serializers import MemberSerializer


# savings/views.py

from django.contrib.auth.models import User
from .models import Group, UserGroup, Transaction
from .serializers import GroupSerializer, TransactionSerializer, UserGroupSerializer
from django.db.models import Sum

class GroupListCreateView(generics.ListCreateAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Get groups where the user is a member
        return Group.objects.filter(usergroup__user=self.request.user)
    
    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        # Automatically add creator to the group as admin
        UserGroup.objects.create(user=self.request.user, group=group, is_admin=True)

class GroupDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Group.objects.filter(usergroup__user=self.request.user)

class TransactionCreateView(generics.CreateAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class GroupTransactionsView(generics.ListAPIView):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Transaction.objects.filter(
            group_id=group_id,
            group__usergroup__user=self.request.user
        )

class DashboardSummaryView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Get active groups count
        active_groups = UserGroup.objects.filter(user=request.user).count()
        
        # Get total saved (sum of all contributions minus withdrawals)
        transactions = Transaction.objects.filter(
            user=request.user
        ).aggregate(
            total_contributions=Sum('amount', filter=models.Q(transaction_type='contribution')),
            total_withdrawals=Sum('amount', filter=models.Q(transaction_type='withdrawal'))
        )
        
        total_saved = (transactions['total_contributions'] or 0) - (transactions['total_withdrawals'] or 0)
        
        # Get recent activity count (last 7 days)
        recent_activity = Transaction.objects.filter(
            user=request.user,
            created_at__gte=timezone.now() - timezone.timedelta(days=7)
        ).count()
        
        return Response({
            'total_saved': total_saved,
            'active_groups': active_groups,
            'recent_activity': recent_activity
        })


class MemberListCreate(generics.ListCreateAPIView):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
