import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';

interface LoginLog {
  id: string;
  action: string;
  ip_address: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
  target_email?: string;
}

export function SettingsPage() {
  const { profile } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState('security');
  const [passwordExpired, setPasswordExpired] = useState(false);
  const [daysUntilExpiry, setDaysUntilExpiry] = useState<number | null>(null);

  useEffect(() => {
    checkPasswordExpiry();
    fetchLoginLogs();
    fetchAuditLogs();
  }, []);

  async function checkPasswordExpiry() {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('profiles')
      .select('password_expires_at')
      .eq('id', profile.id)
      .single();

    if (data?.password_expires_at) {
      const expiresAt = new Date(data.password_expires_at);
      const now = new Date();
      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      setDaysUntilExpiry(daysLeft);
      setPasswordExpired(daysLeft <= 0);
    }
  }

  async function fetchLoginLogs() {
    const { data } = await supabase
      .from('admin_login_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setLoginLogs(data);
    }
  }

  async function fetchAuditLogs() {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Fetch target user emails
      const logsWithEmails = await Promise.all(
        data.map(async (log) => {
          if (log.target_user_id) {
            const { data: targetProfile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', log.target_user_id)
              .single();
            return { ...log, target_email: targetProfile?.email };
          }
          return log;
        })
      );
      setAuditLogs(logsWithEmails);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (newPassword.length < 12) {
      setPasswordError('Password must be at least 12 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      setPasswordError('Password must contain at least one special character (!@#$%^&*)');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setChangingPassword(true);

    try {
      // Change password via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
        return;
      }

      // Update password changed timestamp
      await supabase.rpc('update_admin_password_changed', {
        p_user_id: profile?.id,
      });

      setPasswordSuccess('Password changed successfully! Expires in 6 months.');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordExpired(false);
      setDaysUntilExpiry(180);
    } catch (err) {
      setPasswordError('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
    }
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login_success: 'Login Success',
      login_failed: 'Login Failed',
      logout: 'Logout',
      password_changed: 'Password Changed',
      suspend_user: 'Suspended User',
      unsuspend_user: 'Unsuspended User',
      delete_user: 'Deleted User',
      pause_user: 'Paused User',
      unpause_user: 'Unpaused User',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('failed') || action.includes('delete')) return '#f44336';
    if (action.includes('suspend') || action.includes('pause')) return '#FF9800';
    if (action.includes('success') || action.includes('changed')) return '#4CAF50';
    return '#888';
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Settings</h2>

      {/* Password Expiry Warning */}
      {daysUntilExpiry !== null && daysUntilExpiry <= 14 && (
        <div
          style={{
            ...styles.alert,
            background: passwordExpired ? '#f44336' : '#FF9800',
          }}
        >
          {passwordExpired
            ? 'Your password has expired. Please change it immediately.'
            : `Your password expires in ${daysUntilExpiry} days. Please change it soon.`}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('security')}
          style={{
            ...styles.tab,
            borderBottom: activeTab === 'security' ? '2px solid #FF6B35' : 'none',
          }}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('loginHistory')}
          style={{
            ...styles.tab,
            borderBottom: activeTab === 'loginHistory' ? '2px solid #FF6B35' : 'none',
          }}
        >
          Login History
        </button>
        <button
          onClick={() => setActiveTab('auditLog')}
          style={{
            ...styles.tab,
            borderBottom: activeTab === 'auditLog' ? '2px solid #FF6B35' : 'none',
          }}
        >
          Audit Log
        </button>
      </div>

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Change Password</h3>
          <p style={styles.helperText}>
            Password must be at least 12 characters with uppercase, lowercase, number, and special
            character.
          </p>

          <form onSubmit={handleChangePassword} style={styles.form}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
            />

            {passwordError && <p style={styles.error}>{passwordError}</p>}
            {passwordSuccess && <p style={styles.success}>{passwordSuccess}</p>}

            <button type="submit" style={styles.submitBtn} disabled={changingPassword}>
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>

          <div style={styles.infoBox}>
            <h4 style={styles.infoTitle}>Password Policy</h4>
            <ul style={styles.infoList}>
              <li>Minimum 12 characters</li>
              <li>At least one uppercase letter (A-Z)</li>
              <li>At least one lowercase letter (a-z)</li>
              <li>At least one number (0-9)</li>
              <li>At least one special character (!@#$%^&*)</li>
              <li>Password expires every 6 months</li>
              <li>Account locks after 5 failed login attempts</li>
            </ul>
          </div>
        </div>
      )}

      {/* Login History Tab */}
      {activeTab === 'loginHistory' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Login History</h3>
          <p style={styles.helperText}>Recent login activity for your account and all admins.</p>

          <div style={styles.logList}>
            {loginLogs.length === 0 ? (
              <p style={styles.emptyText}>No login history yet.</p>
            ) : (
              loginLogs.map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <span style={{ ...styles.logAction, color: getActionColor(log.action) }}>
                    {getActionLabel(log.action)}
                  </span>
                  <span style={styles.logIp}>{log.ip_address || 'Unknown IP'}</span>
                  <span style={styles.logDate}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'auditLog' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Admin Audit Log</h3>
          <p style={styles.helperText}>All administrative actions are logged here.</p>

          <div style={styles.logList}>
            {auditLogs.length === 0 ? (
              <p style={styles.emptyText}>No audit log entries yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <span style={{ ...styles.logAction, color: getActionColor(log.action) }}>
                    {getActionLabel(log.action)}
                  </span>
                  {log.target_email && (
                    <span style={styles.logTarget}>Target: {log.target_email}</span>
                  )}
                  <span style={styles.logDate}>
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '24px' },
  alert: {
    padding: '16px',
    borderRadius: '8px',
    color: '#fff',
    marginBottom: '24px',
    fontWeight: '500',
  },
  tabs: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid #333',
    marginBottom: '24px',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    padding: '12px 0',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' },
  helperText: { color: '#888', marginBottom: '16px', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #333',
    background: '#1a1a1a',
    color: '#fff',
    fontSize: '14px',
  },
  submitBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#FF6B35',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  error: { color: '#f44336', margin: 0, fontSize: '14px' },
  success: { color: '#4CAF50', margin: 0, fontSize: '14px' },
  infoBox: {
    background: '#1a1a1a',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '24px',
    maxWidth: '400px',
  },
  infoTitle: { color: '#fff', margin: '0 0 12px 0', fontSize: '14px' },
  infoList: { color: '#888', margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.8' },
  logList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  logItem: {
    background: '#1a1a1a',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  logAction: { fontWeight: '600', minWidth: '140px' },
  logIp: { color: '#666', fontSize: '13px' },
  logTarget: { color: '#888', fontSize: '13px' },
  logDate: { color: '#666', fontSize: '13px', marginLeft: 'auto' },
  emptyText: { color: '#666', padding: '24px', textAlign: 'center' },
};
