import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Shield, LogOut, Home } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  
  const isAdminView = location.pathname.includes('/admin');

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <h1 className="text-xl font-bold text-gray-900">
              Teacher Feedback Collection System
            </h1>
            <p className="text-sm text-gray-600">
              Submit your feedback for all subjects
            </p>
          </div>
          
          <div className="flex gap-2 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 mr-2">
                  Welcome, {user?.username}
                </span>
                
                {!isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Forms
                  </Button>
                )}
                
                {isAdmin && (
                  <Button
                    variant={isAdminView ? "default" : "outline"}
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={logout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/student-login')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Student Login
                </Button>
                <Button
                  variant="default"
                  onClick={() => navigate('/admin-login')}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Admin Login
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;