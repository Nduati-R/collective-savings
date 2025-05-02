from django.urls import path
from .views import (
    GroupListCreateView, GroupDetailView,
    TransactionCreateView, GroupTransactionsView,
    DashboardSummaryView
)
urlpatterns = [
    path('groups/', GroupListCreateView.as_view(), name='group-list'),
    path('groups/<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('transactions/', TransactionCreateView.as_view(), name='transaction-create'),
    path('groups/<int:group_id>/transactions/', GroupTransactionsView.as_view(), name='group-transactions'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
]
