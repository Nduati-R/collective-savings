
from rest_framework import serializers
from .models import Transaction
from users.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = ('id', 'group', 'user', 'username', 'amount', 'type', 'status', 'timestamp')
        read_only_fields = ('id', 'timestamp')
    
    def get_username(self, obj):
        return obj.user.username

class ContributionSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

class WithdrawalSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

class TransactionActionSerializer(serializers.Serializer):
    transaction_id = serializers.CharField()
