# savings/admin.py
from django.contrib import admin
from .models import Group, UserGroup, Transaction

admin.site.register(Group)
admin.site.register(UserGroup)
admin.site.register(Transaction)