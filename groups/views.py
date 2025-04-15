
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Group
from .serializers import GroupSerializer, CreateGroupSerializer

class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Return groups where the user is a member
        return Group.objects.filter(members=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateGroupSerializer
        return GroupSerializer
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
        
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        group = self.get_object()
        # Check if user is already a member
        if request.user in group.members.all():
            return Response({"detail": "You are already a member of this group."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        group.members.add(request.user)
        return Response({"detail": "Successfully joined the group."}, 
                        status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        group = self.get_object()
        
        # Check if user is a member
        if request.user not in group.members.all():
            return Response({"detail": "You are not a member of this group."}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user is the admin
        if group.admin == request.user:
            return Response(
                {"detail": "Admin cannot leave the group. Transfer ownership first."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        group.members.remove(request.user)
        return Response({"detail": "Successfully left the group."}, 
                        status=status.HTTP_200_OK)
