import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdminDashboard } from './home/AdminDashboard';
import { CustomerHome } from './home/CustomerHome';
import { TechnicianHome } from './home/TechnicianHome';

export function HomeScreen() {
  const { user } = useAuth();
  if (user?.role === 'customer') return <CustomerHome />;
  if (user?.role === 'technician') return <TechnicianHome />;
  return <AdminDashboard />;
}
