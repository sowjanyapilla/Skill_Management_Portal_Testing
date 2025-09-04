import { Users, Award, TrendingUp, LogIn } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-indigo-100">
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Forsys Skill Management System
            </h1>
            <p className="text-base text-gray-600 mb-6 leading-relaxed">
              Empower your journey with <span className="font-semibold text-blue-600">Forsys</span>. 
              Unlock potential, track certifications, and explore growth opportunities.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
              <Award className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700">
                Track your skills and certifications
              </span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-100 shadow-sm">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">
                Discover skill matching opportunities
              </span>
            </div>
          </div>

          {/* Login */}
          <div className="space-y-6">
            <button
              onClick={() => {
                window.location.href = "http://localhost:8000/auth/google-login";
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-medium">Login with Google</span>
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
