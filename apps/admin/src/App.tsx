import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { useState } from 'react';

export default function App() {
  const { user, loading, isAdmin, profile } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#fff', flexDirection: 'column' }}>
        <h1>Access Denied</h1>
        <p>You do not have admin privileges.</p>
        <p>Your role: {profile?.role || 'user'}</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <nav style={{ background: '#1a1a1a', padding: '16px 24px', display: 'flex', gap: '24px' }}>
        <button 
          onClick={() => setCurrentPage('dashboard')} 
          style={{ background: currentPage === 'dashboard' ? '#FF6B35' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setCurrentPage('users')} 
          style={{ background: currentPage === 'users' ? '#FF6B35' : 'transparent', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}
        >
          Users
        </button>
      </nav>
      
      {currentPage === 'dashboard' && <DashboardPage />}
      {currentPage === 'users' && <UsersPage />}
    </div>
  );
}
