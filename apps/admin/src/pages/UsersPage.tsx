import { useState, useEffect } from 'react';
import { supabase, Profile } from '../services/supabase';

export function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  }

  async function suspendUser(userId: string, reason: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_suspended: true, 
        suspension_reason: reason,
        suspended_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (!error) {
      await logAdminAction('suspend_user', userId, { reason });
      fetchUsers();
    }
  }

  async function unsuspendUser(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_suspended: false, 
        suspension_reason: null,
        suspended_at: null
      })
      .eq('id', userId);
    
    if (!error) {
      await logAdminAction('unsuspend_user', userId, {});
      fetchUsers();
    }
  }

  async function resetUserPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      alert('Password reset email sent to ' + email);
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    
    // Call delete-user-data function
    const { data: session } = await supabase.auth.getSession();
    const response = await fetch(
      'https://bvyzvqzpmlqvnkujjaao.supabase.co/functions/v1/delete-user-data',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      }
    );
    
    if (response.ok) {
      await logAdminAction('delete_user', userId, { email });
      alert('User deleted successfully');
      fetchUsers();
    } else {
      alert('Error deleting user');
    }
  }

  async function logAdminAction(action: string, targetUserId: string, details: object) {
    const { data: session } = await supabase.auth.getSession();
    await supabase.from('admin_audit_log').insert({
      admin_id: session.session?.user.id,
      action,
      target_user_id: targetUserId,
      details,
    });
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={styles.loading}>Loading users...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Management</h2>
      
      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.search}
      />
      
      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span>Email</span>
          <span>Role</span>
          <span>Level</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        
        {filteredUsers.map(user => (
          <div key={user.id} style={styles.tableRow}>
            <span style={styles.email}>{user.email}</span>
            <span style={styles.badge}>{user.role}</span>
            <span>{user.experience_level}</span>
            <span style={user.is_suspended ? styles.suspended : styles.active}>
              {user.is_suspended ? 'Suspended' : 'Active'}
            </span>
            <div style={styles.actions}>
              <button 
                onClick={() => resetUserPassword(user.email)}
                style={styles.actionBtn}
              >
                Reset PW
              </button>
              {user.is_suspended ? (
                <button 
                  onClick={() => unsuspendUser(user.id)}
                  style={{...styles.actionBtn, background: '#4CAF50'}}
                >
                  Unsuspend
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const reason = prompt('Suspension reason:');
                    if (reason) suspendUser(user.id, reason);
                  }}
                  style={{...styles.actionBtn, background: '#FF9800'}}
                >
                  Suspend
                </button>
              )}
              <button 
                onClick={() => deleteUser(user.id, user.email)}
                style={{...styles.actionBtn, background: '#f44336'}}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  loading: { color: '#fff', padding: '48px', textAlign: 'center' },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '24px' },
  search: { width: '100%', maxWidth: '400px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', marginBottom: '24px' },
  table: { background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', padding: '16px', background: '#222', color: '#888', fontWeight: '600' },
  tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr', padding: '16px', borderTop: '1px solid #333', alignItems: 'center' },
  email: { color: '#fff' },
  badge: { background: '#333', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', color: '#fff' },
  suspended: { color: '#f44336' },
  active: { color: '#4CAF50' },
  actions: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer', fontSize: '12px' },
};
