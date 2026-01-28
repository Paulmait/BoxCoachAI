import { useState, useEffect } from 'react';
import { supabase, supabaseUrl, Profile } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

export function UsersPage() {
  const { profile: currentAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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

  // Check if current admin can modify target user
  function canModifyUser(targetUser: Profile): boolean {
    if (!currentAdmin) return false;

    // Cannot modify yourself
    if (targetUser.id === currentAdmin.id) return false;

    // Super admin can modify anyone (except themselves)
    if (currentAdmin.role === 'super_admin') return true;

    // Regular admin can only modify regular users
    if (currentAdmin.role === 'admin') {
      return targetUser.role === 'user';
    }

    return false;
  }

  // Get reason why user cannot be modified
  function getProtectionReason(targetUser: Profile): string | null {
    if (!currentAdmin) return 'Not authenticated';

    if (targetUser.id === currentAdmin.id) {
      return 'Cannot modify your own account';
    }

    if (currentAdmin.role === 'admin' && targetUser.role !== 'user') {
      return 'Only super_admin can modify admin accounts';
    }

    return null;
  }

  async function pauseUser(userId: string, hours: number) {
    const pauseUntil = new Date(Date.now() + hours * 60 * 60 * 1000);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspension_reason: `Temporarily paused for ${hours} hours`,
        suspended_at: new Date().toISOString(),
        paused_until: pauseUntil.toISOString(),
      })
      .eq('id', userId);

    if (!error) {
      await logAdminAction('pause_user', userId, { hours, pause_until: pauseUntil.toISOString() });
      fetchUsers();
    }
  }

  async function suspendUser(userId: string, reason: string) {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        paused_until: null, // Permanent suspension has no expiration
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
        suspended_at: null,
        paused_until: null,
      })
      .eq('id', userId);

    if (!error) {
      await logAdminAction('unsuspend_user', userId, {});
      fetchUsers();
    }
  }

  async function resetUserPassword(email: string, userId: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert('Error: ' + error.message);
    } else {
      await logAdminAction('reset_password', userId, { email });
      alert('Password reset email sent to ' + email);
    }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}?\n\nThis will permanently delete:\n- All videos\n- All analyses\n- All drill completions\n- User profile\n\nThis cannot be undone.`)) {
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    const response = await fetch(
      `${supabaseUrl}/functions/v1/delete-user-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({ targetUserId: userId }),
      }
    );

    if (response.ok) {
      await logAdminAction('delete_user', userId, { email });
      alert('User deleted successfully');
      fetchUsers();
    } else {
      const error = await response.json();
      alert('Error deleting user: ' + (error.error || 'Unknown error'));
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.display_name?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return '#f44336';
      case 'admin':
        return '#FF6B35';
      default:
        return '#333';
    }
  };

  if (loading) return <div style={styles.loading}>Loading users...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Management</h2>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.search}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={styles.select}
        >
          <option value="all">All Roles</option>
          <option value="user">Users Only</option>
          <option value="admin">Admins Only</option>
          <option value="super_admin">Super Admins</option>
        </select>
      </div>

      <div style={styles.stats}>
        <span>
          Total: {users.length} | Showing: {filteredUsers.length} | Suspended:{' '}
          {users.filter((u) => u.is_suspended).length}
        </span>
      </div>

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span>Email</span>
          <span>Role</span>
          <span>Level</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filteredUsers.map((user) => {
          const canModify = canModifyUser(user);
          const protectionReason = getProtectionReason(user);
          const isProtected = !canModify;

          return (
            <div
              key={user.id}
              style={{
                ...styles.tableRow,
                opacity: isProtected ? 0.6 : 1,
              }}
            >
              <div>
                <span style={styles.email}>{user.email}</span>
                {user.display_name && (
                  <span style={styles.displayName}>{user.display_name}</span>
                )}
              </div>
              <span
                style={{
                  ...styles.badge,
                  background: getRoleBadgeColor(user.role),
                }}
              >
                {user.role}
              </span>
              <span style={styles.level}>{user.experience_level}</span>
              <span style={user.is_suspended ? styles.suspended : styles.active}>
                {user.is_suspended ? 'Suspended' : 'Active'}
              </span>
              <div style={styles.actions}>
                {isProtected ? (
                  <span style={styles.protected} title={protectionReason || ''}>
                    Protected
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => resetUserPassword(user.email, user.id)}
                      style={styles.actionBtn}
                      title="Send password reset email"
                    >
                      Reset PW
                    </button>
                    {user.is_suspended ? (
                      <button
                        onClick={() => unsuspendUser(user.id)}
                        style={{ ...styles.actionBtn, background: '#4CAF50' }}
                      >
                        Restore
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            const hours = prompt('Pause for how many hours? (1-72)', '24');
                            if (hours) {
                              const h = parseInt(hours);
                              if (h >= 1 && h <= 72) {
                                pauseUser(user.id, h);
                              } else {
                                alert('Please enter a number between 1 and 72');
                              }
                            }
                          }}
                          style={{ ...styles.actionBtn, background: '#2196F3' }}
                          title="Temporarily pause account"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Suspension reason:');
                            if (reason) suspendUser(user.id, reason);
                          }}
                          style={{ ...styles.actionBtn, background: '#FF9800' }}
                          title="Permanently suspend until manually restored"
                        >
                          Suspend
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deleteUser(user.id, user.email)}
                      style={{ ...styles.actionBtn, background: '#f44336' }}
                      title="Permanently delete user and all data"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.legend}>
        <h4 style={styles.legendTitle}>Action Legend</h4>
        <ul style={styles.legendList}>
          <li>
            <strong>Reset PW:</strong> Sends password reset email to user
          </li>
          <li>
            <strong>Pause:</strong> Temporarily suspends account for 1-72 hours
          </li>
          <li>
            <strong>Suspend:</strong> Permanently suspends until manually restored
          </li>
          <li>
            <strong>Delete:</strong> Permanently deletes user and all their data
          </li>
          <li>
            <strong>Protected:</strong> Admin accounts can only be modified by super_admin
          </li>
        </ul>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  loading: { color: '#fff', padding: '48px', textAlign: 'center' },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '24px' },
  filters: { display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
  search: {
    flex: 1,
    minWidth: '250px',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
  },
  stats: { color: '#888', marginBottom: '16px', fontSize: '14px' },
  table: { background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
    padding: '16px',
    background: '#222',
    color: '#888',
    fontWeight: '600',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr',
    padding: '16px',
    borderTop: '1px solid #333',
    alignItems: 'center',
  },
  email: { color: '#fff', display: 'block' },
  displayName: { color: '#666', fontSize: '12px', display: 'block', marginTop: '2px' },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#fff',
    display: 'inline-block',
  },
  level: { color: '#888' },
  suspended: { color: '#f44336' },
  active: { color: '#4CAF50' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    background: '#333',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
  },
  protected: {
    color: '#666',
    fontSize: '12px',
    fontStyle: 'italic',
  },
  legend: {
    marginTop: '24px',
    background: '#1a1a1a',
    borderRadius: '8px',
    padding: '20px',
  },
  legendTitle: { color: '#fff', margin: '0 0 12px 0', fontSize: '14px' },
  legendList: {
    color: '#888',
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    lineHeight: '1.8',
  },
};
