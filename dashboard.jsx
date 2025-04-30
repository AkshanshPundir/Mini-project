import React from 'react';
import { useQuery } from 'react-query';
import {
  Card, CardContent, CardHeader, CardTitle,
  Grid, Spinner, Alert
} from './ui-components';
import MetricCard from './dashboard/MetricCard';
import ProfitLossChart from './dashboard/ProfitLossChart';
import CategoryDistributionChart from './dashboard/CategoryDistributionChart';
import StockStatusChart from './dashboard/StockStatusChart';
import ProfitDistributionChart from './dashboard/ProfitDistributionChart';
import AlertItem from './dashboard/AlertItem';

export default function Dashboard() {
  // Fetch dashboard data
  const { data: metrics, isLoading: isLoadingMetrics } = useQuery(
    'dashboardMetrics',
    async () => {
      const response = await fetch('/api/dashboard/metrics');
      if (!response.ok) throw new Error('Failed to fetch dashboard metrics');
      return response.json();
    }
  );

  const { data: profitLossData, isLoading: isLoadingProfitLoss } = useQuery(
    'profitLossData',
    async () => {
      const response = await fetch('/api/dashboard/profit-loss');
      if (!response.ok) throw new Error('Failed to fetch profit/loss data');
      return response.json();
    }
  );

  const { data: products, isLoading: isLoadingProducts } = useQuery(
    'products',
    async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  );

  const { data: alerts, isLoading: isLoadingAlerts } = useQuery(
    'alerts',
    async () => {
      const response = await fetch('/api/dashboard/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    }
  );

  // Loading state
  if (isLoadingMetrics || isLoadingProfitLoss || isLoadingProducts || isLoadingAlerts) {
    return <Spinner />;
  }

  // Calculate profit percentage
  const profitableItemsPercentage = metrics 
    ? Math.round((metrics.profitableItems / metrics.totalProducts) * 100) || 0
    : 0;

  // Get low stock products
  const lowStockProducts = products.filter(p => p.status === "low-stock" || p.status === "out-of-stock");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      <Grid cols={1} mdCols={2} lgCols={4} gap={4}>
        <MetricCard
          title="Total Products"
          value={metrics.totalProducts}
          change={{ value: 0, isPositive: true }}
          icon="package"
          iconBgColor="bg-primary/10"
          iconColor="text-primary"
        />
        <MetricCard
          title="Low Stock Items"
          value={metrics.lowStockItems}
          change={{ value: 0, isPositive: false }}
          icon="alert-triangle"
          iconBgColor="bg-warning/10"
          iconColor="text-warning"
        />
        <MetricCard
          title="Profitable Items"
          value={metrics.profitableItems}
          change={{ value: profitableItemsPercentage, isPositive: true }}
          icon="trending-up"
          iconBgColor="bg-profit/10"
          iconColor="text-profit"
          period="of total"
        />
        <MetricCard
          title="Loss Items"
          value={metrics.lossItems}
          change={{ value: 100 - profitableItemsPercentage, isPositive: false }}
          icon="trending-down"
          iconBgColor="bg-loss/10"
          iconColor="text-loss"
          period="of total"
        />
      </Grid>

      <Grid cols={1} mdCols={2} gap={4}>
        <ProfitLossChart data={profitLossData} />
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.length > 0 ? (
                alerts.map(alert => (
                  <AlertItem key={alert.id} alert={alert} />
                ))
              ) : (
                <Alert variant="info">No alerts at this time</Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid cols={1} mdCols={3} gap={4}>
        <CategoryDistributionChart products={products} />
        <StockStatusChart products={products} />
        <ProfitDistributionChart products={products} />
      </Grid>
      
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reorder Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {lowStockProducts.map(product => (
                    <tr key={product.id}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.quantity}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{product.reorderLevel}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          product.status === 'out-of-stock' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.status === 'out-of-stock' ? 'Out of stock' : 'Low stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
