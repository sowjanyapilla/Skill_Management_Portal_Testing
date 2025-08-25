import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OAuthCallback from './components/OAuthCallback';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user'); 
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    // Mock Google login - in a real app, this would integrate with Google OAuth
    const mockUser: User = {
      id: 123,
      email: 'john.doe@company.com',
      name: 'John Doe',
      avatar_url: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
      is_manager: true, // Set to true to see manager features, false for regular employee
      created_at: new Date().toISOString(),
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
  <BrowserRouter>
  <Routes>
     <Route path="/" element={<LoginPage onLogin={handleLogin} />} />
    <Route path="/oauth-callback" element={<OAuthCallback onLogin={setUser} />} />
    <Route
  path="/dashboard"
  element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />}
/>
  </Routes>
</BrowserRouter>
);
}
export default App;