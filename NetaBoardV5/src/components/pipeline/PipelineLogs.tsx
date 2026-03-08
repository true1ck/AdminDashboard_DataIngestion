// ═══ Pipeline Intel — Logs & Audit ═══
// Displays the audit trail (lifecycle events) and dead-letter queue (DLQ).

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PIPELINE_API = 'http://localhost:8500/api/v1';

interface PipelineEvent {
  id?: string;
  stage: string;
  event_type: string;
  platform?: string;
  entity?: string;
  topic?: string;
  text?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  pipeline_id?: string;
  is_threat?: boolean;
}

type Tab = 'audit' | 'dlq';

export default function PipelineLogs() {
  const [tab, setTab] = useState<Tab>('audit');
  const [auditEvents, setAuditEvents] = useState<PipelineEvent[]>([]);
  const [dlqEvents, setDlqEvents] = useState<PipelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [stageFilter, setStageFilter] = useState('');
  const [searchText, setSearchText] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [auditRes, dlqRes] = await Promise.all([
        axios.get(`${PIPELINE_API}/events`, { params: { event_type: 'audit', limit: 200 } }),
        axios.get(`${PIPELINE_API}/events`, { params: { event_type: 'error', limit: 100 } }),
      ]);
      setAuditEvents(auditRes.data);
      setDlqEvents(dlqRes.data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchEvents();
    const t = setInterval(fetchEvents, 10000);
    return () => clearInterval(t);
  }, [fetchEvents]);

  const downloadCSV = () => {
    const events = tab === 'audit' ? auditEvents : dlqEvents;
    const headers = ['timestamp', 'pipeline_id', 'stage', 'event_type', 'entity', 'platform', 'text', 'error_message'];
    const rows = events.map(e =>
      headers.map(h => JSON.stringify((e as any)[h] ?? '')).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_${tab}_${Date.now()}.csv`;
    a.click();
  };

  const STAGES = ['', 'collector', 'transformer', 'processor', 'consumer'];

  const filterEvents = (events: PipelineEvent[]) => events.filter(e => {
    if (stageFilter && e.stage !== stageFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        (e.text || '').toLowerCase().includes(q) ||
        (e.entity || '').toLowerCase().includes(q) ||
        (e.platform || '').toLowerCase().includes(q) ||
        (e.error_message || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const displayEvents = filterEvents(tab === 'audit' ? auditEvents : dlqEvents);

  const STAGE_COLORS: Record<string, string> = {
    collector: 'var(--am)', transformer: 'var(--bl)',
    processor: 'var(--em)', consumer: 'var(--gd)', unknown: 'var(--mn)',
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div className="nb-card flex items-center gap-3">
        <div className="flex gap-2">
          {(['audit', 'dlq'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
              style={{
                background: tab === t ? 'var(--am)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--sub)',
                border: `1px solid ${tab === t ? 'var(--am)' : 'var(--bd)'}`,
              }}
            >
              {t === 'audit' ? '📋 Audit Trail' : '💀 Dead Letter Queue'}
              <span className="ml-1.5 text-[10px] opacity-70">
                ({(t === 'audit' ? auditEvents : dlqEvents).length})
              </span>
            </button>
          ))}
        </div>
        <div className="flex-1" />

        {/* Search */}
        <input
          className="rounded-lg border px-3 py-1.5 text-[12px] bg-cd/50 w-48"
          style={{ borderColor: 'var(--bd)', color: 'var(--tx)' }}
          placeholder="Search events..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />

        {/* Stage filter */}
        <select
          className="rounded-lg border px-2 py-1.5 text-[12px] bg-cd/50"
          style={{ borderColor: 'var(--bd)', color: 'var(--tx)' }}
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          {STAGES.filter(Boolean).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <button onClick={fetchEvents} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--am)' }}>
          ↻ Refresh
        </button>
        <button onClick={downloadCSV} className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--mn)' }}>
          ⬇ CSV
        </button>
      </div>

      {/* Table */}
      <div className="nb-card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--mn)' }}>Loading...</div>
        ) : displayEvents.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--mn)' }}>
            <div className="text-3xl mb-2">{tab === 'audit' ? '📋' : '💀'}</div>
            <div>No {tab === 'audit' ? 'audit' : 'DLQ'} events yet</div>
          </div>
        ) : (
          <table className="w-full text-[12px]" style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <thead>
              <tr style={{ color: 'var(--mn)' }}>
                <th className="text-left py-2 pr-4 font-medium">Time</th>
                <th className="text-left py-2 pr-4 font-medium">Stage</th>
                <th className="text-left py-2 pr-4 font-medium">Entity</th>
                <th className="text-left py-2 pr-4 font-medium">Platform</th>
                <th className="text-left py-2 pr-4 font-medium">
                  {tab === 'audit' ? 'Event' : 'Error'}
                </th>
                {tab === 'dlq' && <th className="text-left py-2 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {displayEvents.map((e, idx) => {
                const stageColor = STAGE_COLORS[e.stage] || 'var(--mn)';
                const time = e.timestamp ? new Date(e.timestamp).toLocaleString() : '—';
                return (
                  <tr
                    key={idx}
                    className="rounded-lg"
                    style={{ background: 'var(--cd)' }}
                  >
                    <td className="py-2 pr-4 text-[11px] rounded-l-lg pl-2" style={{ color: 'var(--mn)' }}>
                      {time}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                        style={{ background: stageColor + '22', color: stageColor }}
                      >
                        {e.stage}
                      </span>
                    </td>
                    <td className="py-2 pr-4" style={{ color: 'var(--tx)' }}>
                      {e.entity || '—'}
                    </td>
                    <td className="py-2 pr-4" style={{ color: 'var(--sub)' }}>
                      {e.platform || '—'}
                    </td>
                    <td className="py-2 pr-4 max-w-xs" style={{ color: 'var(--sub)' }}>
                      <span className="truncate block">
                        {tab === 'audit'
                          ? (e.text || '').slice(0, 120)
                          : (e.error_message || e.text || '').slice(0, 120)}
                      </span>
                    </td>
                    {tab === 'dlq' && (
                      <td className="py-2 rounded-r-lg pr-2">
                        <button
                          className="text-[10px] px-2 py-0.5 rounded border"
                          style={{ borderColor: 'var(--am)', color: 'var(--am)' }}
                          onClick={async () => {
                            // Re-push event to the live feed as a retry
                            await axios.post(`${PIPELINE_API}/events`, {
                              ...e,
                              event_type: 'trace',
                              text: `[RETRY] ${e.text || ''}`,
                            });
                          }}
                        >
                          Retry
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
