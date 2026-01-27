import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface Violation {
  id: string;
  user_id: string;
  violation_type: string;
  description: string | null;
  status: string;
  created_at: string;
  user_email?: string;
}

export function ViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchViolations();
  }, [filter]);

  async function fetchViolations() {
    setLoading(true);
    let query = supabase
      .from('user_violations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch user emails for each violation
      const violationsWithEmails = await Promise.all(
        data.map(async (v) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', v.user_id)
            .single();
          return { ...v, user_email: profile?.email || 'Unknown' };
        })
      );
      setViolations(violationsWithEmails);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase
      .from('user_violations')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) {
      fetchViolations();
    }
  }

  async function suspendUser(userId: string, violationId: string) {
    // Suspend the user
    await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspension_reason: 'Violation of terms',
        suspended_at: new Date().toISOString(),
      })
      .eq('id', userId);

    // Update violation status
    await updateStatus(violationId, 'resolved');
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'reviewed':
        return '#2196F3';
      case 'resolved':
        return '#4CAF50';
      case 'dismissed':
        return '#888';
      default:
        return '#888';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inappropriate_content':
        return 'Inappropriate Content';
      case 'spam':
        return 'Spam';
      case 'abuse':
        return 'Abuse';
      case 'terms_violation':
        return 'Terms Violation';
      default:
        return type;
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading violations...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>User Violations</h2>
        <div style={styles.filters}>
          {['all', 'pending', 'reviewed', 'resolved', 'dismissed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                background: filter === f ? '#FF6B35' : '#333',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {violations.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No {filter === 'all' ? '' : filter} violations found.</p>
          <p style={styles.emptySubtext}>This is good news!</p>
        </div>
      ) : (
        <div style={styles.list}>
          {violations.map((v) => (
            <div key={v.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.statusBadge, background: getStatusColor(v.status) }}>
                  {v.status}
                </span>
                <span style={styles.typeBadge}>{getTypeLabel(v.violation_type)}</span>
                <span style={styles.date}>
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={styles.cardBody}>
                <p style={styles.userEmail}>User: {v.user_email}</p>
                {v.description && <p style={styles.description}>{v.description}</p>}
              </div>

              {v.status === 'pending' && (
                <div style={styles.actions}>
                  <button
                    onClick={() => updateStatus(v.id, 'reviewed')}
                    style={{ ...styles.actionBtn, background: '#2196F3' }}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(v.id, 'dismissed')}
                    style={{ ...styles.actionBtn, background: '#666' }}
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => suspendUser(v.user_id, v.id)}
                    style={{ ...styles.actionBtn, background: '#f44336' }}
                  >
                    Suspend User
                  </button>
                </div>
              )}

              {v.status === 'reviewed' && (
                <div style={styles.actions}>
                  <button
                    onClick={() => updateStatus(v.id, 'resolved')}
                    style={{ ...styles.actionBtn, background: '#4CAF50' }}
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => suspendUser(v.user_id, v.id)}
                    style={{ ...styles.actionBtn, background: '#f44336' }}
                  >
                    Suspend User
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  loading: { color: '#fff', padding: '48px', textAlign: 'center' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 },
  filters: { display: 'flex', gap: '8px' },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  empty: {
    background: '#1a1a1a',
    borderRadius: '8px',
    padding: '48px',
    textAlign: 'center',
  },
  emptyText: { color: '#fff', fontSize: '18px', margin: '0 0 8px 0' },
  emptySubtext: { color: '#4CAF50', margin: 0 },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: '#1a1a1a',
    borderRadius: '8px',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#fff',
    textTransform: 'uppercase',
  },
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '12px',
    background: '#333',
    color: '#fff',
  },
  date: { color: '#666', fontSize: '14px', marginLeft: 'auto' },
  cardBody: { marginBottom: '16px' },
  userEmail: { color: '#fff', margin: '0 0 8px 0' },
  description: { color: '#888', margin: 0, fontSize: '14px' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
