import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { User, Shield } from 'lucide-react';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isAdminView = location.pathname.includes('/admin');
  const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Teacher Feedback Collection System
            </h1>
            <p className="text-sm text-gray-600">
              Submit your feedback for all subjects
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={isAdminView ? "outline" : "default"}
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Student View
            </Button>
            <Button
              variant={isAdminView ? "default" : "outline"}
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <Shield className="h-4 w-4" />
              Admin View
              {feedbacks.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {feedbacks.length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;