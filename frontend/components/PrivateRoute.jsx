import React from 'react'
import { useUser } from '../src/context/UserContext'; 
import { Outlet, Navigate } from 'react-router-dom'

function PrivateRoute() {
    const {user, isLoading} = useUser();

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    user ? <Outlet /> : <Navigate to='/login' replace />
  )
}

export default PrivateRoute