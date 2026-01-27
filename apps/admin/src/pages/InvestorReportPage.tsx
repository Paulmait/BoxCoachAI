import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface MetricData {
  metric_date: string;
  total_users: number;
  dau: number;
  wau: number;
  mau: number;
  new_signups: number;
  dau_mau_ratio: number;
  total_analyses: number;
  total_drills_completed: number;
  churn_rate: number;
  daily_revenue: number;
  mtd_revenue: number;
}

interface FeatureUsage {
  feature_name: string;
  total_usage: number;
}

export function InvestorReportPage() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  async function fetchData() {
    setLoading(true);

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    const dateStr = daysAgo.toISOString().split('T')[0];

    // Fetch metrics
    const { data: metricsData } = await supabase
      .from('app_metrics')
      .select('*')
      .gte('metric_date', dateStr)
      .order('metric_date', { ascending: false });

    if (metricsData) {
      setMetrics(metricsData as MetricData[]);
    }

    // Fetch feature usage
    const { data: features } = await supabase
      .from('feature_usage')
      .select('feature_name')
      .gte('usage_date', dateStr);

    if (features) {
      const grouped = features.reduce((acc: Record<string, number>, curr) => {
        acc[curr.feature_name] = (acc[curr.feature_name] || 0) + 1;
        return acc;
      }, {});

      setFeatureUsage(
        Object.entries(grouped)
          .map(([feature_name, total_usage]) => ({ feature_name, total_usage }))
          .sort((a, b) => b.total_usage - a.total_usage)
      );
    }

    setLoading(false);
  }

  function exportReport() {
    const latest = metrics[0];
    const lines = [
      'BOXCOACH AI - INVESTOR METRICS REPORT',
      'Generated: ' + new Date().toISOString(),
      'Period: Last ' + dateRange + ' days',
      '',
      '=== KEY METRICS ===',
      'Total Users: ' + (latest?.total_users || 0),
      'Daily Active Users (DAU): ' + (latest?.dau || 0),
      'Weekly Active Users (WAU): ' + (latest?.wau || 0),
      'Monthly Active Users (MAU): ' + (latest?.mau || 0),
      'DAU/MAU Ratio: ' + (latest?.dau_mau_ratio || 0) + '%',
      'Churn Rate: ' + (latest?.churn_rate || 0) + '%',
      '',
      '=== ENGAGEMENT ===',
      'Total Analyses: ' + (latest?.total_analyses || 0),
      'Total Drills Completed: ' + (latest?.total_drills_completed || 0),
      '',
      '=== FEATURE ADOPTION ===',
      ...featureUsage.map((f) => f.feature_name + ': ' + f.total_usage + ' uses'),
      '',
      '=== HISTORICAL DATA ===',
      ...metrics.map((m) => m.metric_date + ': ' + m.total_users + ' users, ' + m.dau + ' DAU'),
    ];

    downloadText(lines.join('\n'), 'boxcoach-investor-report.txt');
  }

  function exportCSV() {
    if (!metrics.length) return;
    const headers = Object.keys(metrics[0]).join(',');
    const rows = metrics.map((m) => Object.values(m).join(','));
    downloadText([headers, ...rows].join('\n'), 'boxcoach-metrics.csv');
  }

  function downloadText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div style={styles.loading}>Loading investor metrics...</div>;
  }

  const latest = metrics[0];

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Investor Report</h2>
        <div style={styles.controls}>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={styles.select}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={exportReport} style={styles.exportBtn}>Export Report</button>
          <button onClick={exportCSV} style={{ ...styles.exportBtn, background: '#4CAF50' }}>Export CSV</button>
        </div>
      </header>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Key Performance Indicators</h3>
        <div style={styles.kpiGrid}>
          <KPICard label="Total Users" value={latest?.total_users || 0} />
          <KPICard label="DAU" value={latest?.dau || 0} />
          <KPICard label="WAU" value={latest?.wau || 0} />
          <KPICard label="MAU" value={latest?.mau || 0} />
          <KPICard label="DAU/MAU Ratio" value={(latest?.dau_mau_ratio || 0) + '%'} highlight />
          <KPICard label="Churn Rate" value={(latest?.churn_rate || 0) + '%'} />
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Engagement</h3>
        <div style={styles.kpiGrid}>
          <KPICard label="Total Analyses" value={latest?.total_analyses || 0} />
          <KPICard label="Drills Completed" value={latest?.total_drills_completed || 0} />
          <KPICard label="New Signups" value={latest?.new_signups || 0} />
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Feature Adoption</h3>
        <div style={styles.featureList}>
          {featureUsage.length === 0 ? (
            <p style={styles.emptyText}>No feature usage data yet. Data populates as users interact with the app.</p>
          ) : (
            featureUsage.map((f) => (
              <div key={f.feature_name} style={styles.featureRow}>
                <span style={styles.featureName}>{f.feature_name}</span>
                <span style={styles.featureValue}>{f.total_usage.toLocaleString()} uses</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Historical Trend</h3>
        {metrics.length === 0 ? (
          <p style={styles.emptyText}>No historical data yet. Run calculate_daily_metrics() to populate.</p>
        ) : (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Date</span>
              <span>Users</span>
              <span>DAU</span>
              <span>Signups</span>
            </div>
            {metrics.slice(0, 14).map((m) => (
              <div key={m.metric_date} style={styles.tableRow}>
                <span>{m.metric_date}</span>
                <span>{m.total_users}</span>
                <span>{m.dau}</span>
                <span>{m.new_signups}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function KPICard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{ ...styles.kpiCard, borderColor: highlight ? '#FF6B35' : '#333' }}>
      <p style={styles.kpiValue}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p style={styles.kpiLabel}>{label}</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  loading: { color: '#fff', padding: '48px', textAlign: 'center' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#fff', margin: 0 },
  controls: { display: 'flex', gap: '12px' },
  select: { padding: '8px 16px', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: '#fff' },
  exportBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#FF6B35', color: '#fff', cursor: 'pointer', fontWeight: '500' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '16px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' },
  kpiCard: { background: '#1a1a1a', borderRadius: '8px', padding: '20px', border: '2px solid #333' },
  kpiValue: { fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 4px 0' },
  kpiLabel: { fontSize: '12px', color: '#888', margin: 0, textTransform: 'uppercase' },
  featureList: { background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' },
  featureRow: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #333' },
  featureName: { color: '#fff' },
  featureValue: { color: '#888' },
  emptyText: { color: '#666', padding: '24px', textAlign: 'center', margin: 0 },
  table: { background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '12px 16px', background: '#222', color: '#888', fontWeight: '600' },
  tableRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '12px 16px', borderTop: '1px solid #333', color: '#fff' },
};
