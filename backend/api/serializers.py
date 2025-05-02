from rest_framework import serializers
from .models import Member
from .models import Group, UserGroup, Transaction
from django.contrib.auth.models import User



class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class GroupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'created_by', 'created_at']

class TransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'amount', 'transaction_type', 'notes', 'user', 'group', 'created_at']

class UserGroupSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    group = GroupSerializer(read_only=True)
    
    class Meta:
        model = UserGroup
        fields = ['id', 'user', 'group', 'is_admin', 'joined_at']

class MemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Member
        fields = '__all__'
