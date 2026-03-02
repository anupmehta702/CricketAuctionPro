
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuction } from '../context/AuctionContext';

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuction();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminRoute;
