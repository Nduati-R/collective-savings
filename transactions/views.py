
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Transaction
from groups.models import Group
from .serializers import (
    TransactionSerializer, 
    ContributionSerializer, 
    WithdrawalSerializer,
    TransactionActionSerializer
)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return transactions for groups where the user is a member
        return Transaction.objects.filter(group__members=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='contribute/(?P<group_id>[^/.]+)')
    def contribute(self, request, group_id=None):
        serializer = ContributionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                group = Group.objects.get(pk=group_id, members=request.user)
            except Group.DoesNotExist:
                return Response(
                    {"detail": "Group not found or you are not a member."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            amount = serializer.validated_data['amount']
            
            # Create contribution transaction
            transaction = Transaction.objects.create(
                group=group,
                user=request.user,
                amount=amount,
                type=Transaction.CONTRIBUTION,
                status=Transaction.APPROVED  # Auto-approve contributions
            )
            
            # Update group current amount
            group.current_amount += amount
            group.save()
            
            return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='withdraw/(?P<group_id>[^/.]+)')
    def withdraw(self, request, group_id=None):
        serializer = WithdrawalSerializer(data=request.data)
        if serializer.is_valid():
            try:
                group = Group.objects.get(pk=group_id, members=request.user)
            except Group.DoesNotExist:
                return Response(
                    {"detail": "Group not found or you are not a member."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            amount = serializer.validated_data['amount']
            
            # Check if withdrawal amount exceeds available funds
            if amount > group.current_amount:
                return Response(
                    {"detail": "Withdrawal amount exceeds available funds."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create withdrawal transaction (pending approval)
            transaction = Transaction.objects.create(
                group=group,
                user=request.user,
                amount=amount,
                type=Transaction.WITHDRAWAL,
                status=Transaction.PENDING
            )
            
            return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='approve/(?P<group_id>[^/.]+)')
    def approve_withdrawal(self, request, group_id=None):
        serializer = TransactionActionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                group = Group.objects.get(pk=group_id)
            except Group.DoesNotExist:
                return Response(
                    {"detail": "Group not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is the admin
            if group.admin != request.user:
                return Response(
                    {"detail": "Only the admin can approve withdrawals."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            transaction_id = serializer.validated_data['transaction_id']
            try:
                transaction = Transaction.objects.get(
                    pk=transaction_id, 
                    group=group, 
                    type=Transaction.WITHDRAWAL,
                    status=Transaction.PENDING
                )
            except Transaction.DoesNotExist:
                return Response(
                    {"detail": "Transaction not found or cannot be approved."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if withdrawal amount exceeds available funds
            if transaction.amount > group.current_amount:
                return Response(
                    {"detail": "Insufficient funds in the group."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update transaction status
            transaction.status = Transaction.APPROVED
            transaction.save()
            
            # Update group current amount
            group.current_amount -= transaction.amount
            group.save()
            
            return Response(TransactionSerializer(transaction).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='reject/(?P<group_id>[^/.]+)')
    def reject_withdrawal(self, request, group_id=None):
        serializer = TransactionActionSerializer(data=request.data)
        if serializer.is_valid():
            try:
                group = Group.objects.get(pk=group_id)
            except Group.DoesNotExist:
                return Response(
                    {"detail": "Group not found."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is the admin
            if group.admin != request.user:
                return Response(
                    {"detail": "Only the admin can reject withdrawals."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            transaction_id = serializer.validated_data['transaction_id']
            try:
                transaction = Transaction.objects.get(
                    pk=transaction_id, 
                    group=group, 
                    type=Transaction.WITHDRAWAL,
                    status=Transaction.PENDING
                )
            except Transaction.DoesNotExist:
                return Response(
                    {"detail": "Transaction not found or cannot be rejected."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update transaction status
            transaction.status = Transaction.REJECTED
            transaction.save()
            
            return Response(TransactionSerializer(transaction).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
