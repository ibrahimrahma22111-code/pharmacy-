import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPackage, FiUsers, FiShoppingCart, FiAlertTriangle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalMedicines: 0,
    lowStockMedicines: 0,
    totalCustomers: 0,
    todaySales: 0,
    todayTransactions: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/sales?startDate=' + new Date().toISOString().split('T')[0])
      ]);
      
      setStats(statsRes.data || {});
      setRecentSales((salesRes.data || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Medicines',
      value: stats.totalMedicines,
      icon: FiPackage,
      color: '#667eea'
    },
    {
      title: 'Low Stock',
      value: stats.lowStockMedicines,
      icon: FiAlertTriangle,
      color: '#f56565'
    },
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: FiUsers,
      color: '#48bb78'
    },
    {
      title: "Today's Sales",
      value: `$${(stats.todaySales || 0).toFixed(2)}`,
      icon: FiShoppingCart,
      color: '#ed8936'
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to Pharmacy Management System</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>
                <Icon />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-title">{stat.title}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Recent Sales</h2>
          <div className="recent-sales">
            {recentSales.length === 0 ? (
              <p className="empty-state">No sales today</p>
            ) : (
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.id}>
                      <td>#{sale.id}</td>
                      <td>{sale.customer_name || 'Walk-in'}</td>
                      <td>${(sale.total_amount || 0).toFixed(2)}</td>
                      <td>{new Date(sale.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button className="action-button">
              <FiShoppingCart />
              <span>New Sale</span>
            </button>
            <button className="action-button">
              <FiPackage />
              <span>Add Medicine</span>
            </button>
            <button className="action-button">
              <FiUsers />
              <span>Add Customer</span>
            </button>
            <button className="action-button">
              <FiAlertTriangle />
              <span>Check Low Stock</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

