import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { ViolationsPage } from './pages/ViolationsPage';
import { InvestorReportPage } from './pages/InvestorReportPage';
import { SettingsPage } from './pages/SettingsPage';
import { useState } from 'react';

export default function App() {
  const { user, loading, isAdmin, profile, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!isAdmin) {
    return (
      <div style={styles.accessDenied}>
        <h1>Access Denied</h1>
        <p>You do not have admin privileges.</p>
        <p>Your role: {profile?.role || 'user'}</p>
        <button onClick={signOut} style={styles.signOutBtn}>
          Sign Out
        </button>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'violations', label: 'Violations' },
    { id: 'investor', label: 'Investor Report' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brand}>
          <h1 style={styles.brandTitle}>BoxCoach Admin</h1>
        </div>
        <div style={styles.userInfo}>
          <span style={styles.userEmail}>{profile?.email}</span>
          <span style={styles.roleBadge}>{profile?.role}</span>
          <button onClick={signOut} style={styles.signOutBtn}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            style={{
              ...styles.navButton,
              background: currentPage === item.id ? '#FF6B35' : 'transparent',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'users' && <UsersPage />}
        {currentPage === 'violations' && <ViolationsPage />}
        {currentPage === 'investor' && <InvestorReportPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    color: '#fff',
    gap: '16px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #333',
    borderTopColor: '#FF6B35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  accessDenied: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    color: '#fff',
    gap: '8px',
  },
  app: {
    minHeight: '100vh',
    background: '#0a0a0a',
  },
  header: {
    background: '#1a1a1a',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #333',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#FF6B35',
    margin: 0,
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userEmail: {
    color: '#888',
    fontSize: '14px',
  },
  roleBadge: {
    background: '#FF6B35',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  signOutBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: '#333',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  nav: {
    background: '#151515',
    padding: '12px 24px',
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #222',
  },
  navButton: {
    border: 'none',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background 0.2s',
  },
  main: {
    minHeight: 'calc(100vh - 120px)',
  },
};
