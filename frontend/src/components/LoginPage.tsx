// import React from 'react';
import { Users, Award, TrendingUp } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Skill Management System
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Unlock your potential and showcase your expertise with enthusiasm! 
              Join our dynamic platform where skills meet opportunities.
            </p>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">Track your skills and certifications</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">Discover skill matching opportunities</span>
            </div>
          </div>

          {/* Login Button */}
          <div className="space-y-6">
            <button
  onClick={() => {
    window.location.href = 'http://localhost:8000/auth/google-login';
  }}
>
  Login with Google
</button>
            
            <p className="text-center text-sm text-gray-500">
              Secure authentication powered by Google
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}