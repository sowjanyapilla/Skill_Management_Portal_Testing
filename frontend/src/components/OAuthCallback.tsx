import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '../types';

interface OAuthCallbackProps {
  onLogin: (user: User) => void;
}

export default function OAuthCallback({ onLogin }: OAuthCallbackProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        const query = new URLSearchParams(location.search);
        
        const token = query.get('token');
        const userStr = query.get('user');
        // console.log(user)
        if (userStr && token) {
          const user: User = JSON.parse(userStr); // ✅ convert string → object
          localStorage.setItem('user', JSON.stringify(user)); // ✅ correct
          localStorage.setItem('token', token);
          onLogin(user);
          navigate('/dashboard');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("OAuth login failed:", error);
        navigate('/');
      }
    };

    handleLogin();
  }, [location, onLogin, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-700 text-lg">Logging you in...</p>
    </div>
  );
}
