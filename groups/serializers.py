
from rest_framework import serializers
from .models import Group
from users.serializers import UserSerializer
from transactions.serializers import TransactionSerializer

class GroupSerializer(serializers.ModelSerializer):
    admin = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    transactions = TransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Group
        fields = ('id', 'name', 'description', 'target_amount', 'current_amount', 
                  'admin', 'members', 'transactions', 'created_at')
        read_only_fields = ('id', 'current_amount', 'created_at')

class CreateGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('name', 'description', 'target_amount')
        
    def create(self, validated_data):
        user = self.context['request'].user
        group = Group.objects.create(
            admin=user,
            **validated_data
        )
        group.members.add(user)
        return group
