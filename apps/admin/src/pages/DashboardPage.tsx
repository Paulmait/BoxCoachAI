import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  totalDrills: number;
  suspendedUsers: number;
  pendingViolations: number;
  newUsersToday: number;
}

export function DashboardPage() {
  const { profile, signOut } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const [users, analyses, drills, suspended, violations, newUsers] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('analyses').select('id', { count: 'exact', head: true }),
      supabase.from('drill_completions').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_suspended', true),
      supabase.from('user_violations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today),
    ]);

    setStats({
      totalUsers: users.count || 0,
      totalAnalyses: analyses.count || 0,
      totalDrills: drills.count || 0,
      suspendedUsers: suspended.count || 0,
      pendingViolations: violations.count || 0,
      newUsersToday: newUsers.count || 0,
    });
    setLoading(false);
  }

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>BoxCoach Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome, {profile?.display_name || profile?.email}</p>
        </div>
        <button onClick={signOut} style={styles.logoutBtn}>Sign Out</button>
      </header>

      <nav style={styles.nav}>
        <a href="#dashboard" style={styles.navLink}>Dashboard</a>
        <a href="#users" style={styles.navLink}>Users</a>
        <a href="#violations" style={styles.navLink}>Violations</a>
        <a href="#analytics" style={styles.navLink}>Analytics</a>
      </nav>

      <div style={styles.statsGrid}>
        <StatCard title="Total Users" value={stats?.totalUsers || 0} color="#4CAF50" />
        <StatCard title="New Today" value={stats?.newUsersToday || 0} color="#2196F3" />
        <StatCard title="Total Analyses" value={stats?.totalAnalyses || 0} color="#FF6B35" />
        <StatCard title="Drills Completed" value={stats?.totalDrills || 0} color="#9C27B0" />
        <StatCard title="Suspended Users" value={stats?.suspendedUsers || 0} color="#f44336" />
        <StatCard title="Pending Violations" value={stats?.pendingViolations || 0} color="#FF9800" />
      </div>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionsGrid}>
          <ActionCard 
            title="Export User Report" 
            description="Download CSV of all users"
            onClick={exportUsers}
          />
          <ActionCard 
            title="Export Analytics" 
            description="Generate investor report"
            onClick={exportAnalytics}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
      <p style={styles.statValue}>{value.toLocaleString()}</p>
      <p style={styles.statTitle}>{title}</p>
    </div>
  );
}

function ActionCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={styles.actionCard}>
      <h3 style={styles.actionTitle}>{title}</h3>
      <p style={styles.actionDesc}>{description}</p>
    </button>
  );
}

async function exportUsers() {
  const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
  if (!data) return;
  
  const csv = [
    ['ID', 'Email', 'Display Name', 'Role', 'Experience', 'Suspended', 'Created At'].join(','),
    ...data.map(u => [u.id, u.email, u.display_name || '', u.role, u.experience_level, u.is_suspended, u.created_at].join(','))
  ].join('\n');
  
  downloadCSV(csv, 'boxcoach-users.csv');
}

async function exportAnalytics() {
  const { data } = await supabase.from('app_metrics').select('*').order('metric_date', { ascending: false });
  if (!data?.length) {
    alert('No metrics data yet. Run calculate_daily_metrics() in SQL.');
    return;
  }
  
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(m => Object.values(m).join(','))
  ].join('\n');
  
  downloadCSV(csv, 'boxcoach-analytics.csv');
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0a0a0a', padding: '24px' },
  loading: { color: '#fff', padding: '48px', textAlign: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#fff', margin: 0 },
  subtitle: { color: '#888', margin: '4px 0 0 0' },
  logoutBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer' },
  nav: { display: 'flex', gap: '24px', marginBottom: '32px', borderBottom: '1px solid #222', paddingBottom: '16px' },
  navLink: { color: '#888', textDecoration: 'none', fontWeight: '500' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' },
  statCard: { background: '#1a1a1a', borderRadius: '8px', padding: '20px' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' },
  statTitle: { fontSize: '14px', color: '#888', margin: 0 },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '16px' },
  actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' },
  actionCard: { background: '#1a1a1a', border: 'none', borderRadius: '8px', padding: '20px', textAlign: 'left', cursor: 'pointer' },
  actionTitle: { fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 8px 0' },
  actionDesc: { fontSize: '14px', color: '#888', margin: 0 },
};
