// ═══ Pipeline Intel — Monitor (Live Feed) ═══
// Real-time event feed from the Entity Intelligence Pipeline API.
// Supports SSE streaming with polling fallback.

import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const PIPELINE_API = 'http://localhost:8500/api/v1';

const PLATFORM_ICONS: Record<string, string> = {
  youtube: '▶',
  twitter: '𝕏',
  instagram: '📷',
  news_rss: '📰',
  india_news: '📰',
  mock: '🧪',
};

const STAGE_COLORS: Record<string, string> = {
  collector:   'var(--am)',
  transformer: 'var(--bl)',
  processor:   'var(--em)',
  consumer:    'var(--gd)',
  unknown:     'var(--mn)',
};

const SENTIMENT_COLOR = (label?: string) =>
  label === 'positive' ? 'var(--gd)' : label === 'negative' ? 'var(--rd)' : 'var(--mn)';

interface PipelineEvent {
  id?: string;
  pipeline_id?: string;
  stage: string;
  node_id?: string;
  event_type: string;
  platform?: string;
  entity?: string;
  topic?: string;
  author?: string;
  text?: string;
  sentiment?: number;
  sentiment_label?: string;
  entities?: string[];
  topic_label?: string;
  is_threat?: boolean;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface Stats {
  total_events: number;
  threats: number;
  platforms: Record<string, number>;
  subscribers: number;
}

export default function PipelineMonitor() {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  // Filters
  const [entity, setEntity] = useState('');
  const [sources, setSources] = useState<string[]>(['youtube', 'news_rss']);
  const [count, setCount] = useState(5);
  const [topicFilter, setTopicFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);

  const [collecting, setCollecting] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // ── SSE connection ────────────────────────────────────────────────────────
  useEffect(() => {
    const connect = () => {
      const es = new EventSource(`${PIPELINE_API}/events/stream`);
      esRef.current = es;
      es.onopen = () => setSseConnected(true);
      es.onmessage = (e) => {
        try {
          const evt: PipelineEvent = JSON.parse(e.data);
          setEvents(prev => [evt, ...prev].slice(0, 200));
        } catch {}
      };
      es.onerror = () => {
        setSseConnected(false);
        es.close();
        // Retry after 5s
        setTimeout(connect, 5000);
      };
    };
    connect();
    return () => {
      esRef.current?.close();
    };
  }, []);

  // ── Polling fallback for topics and stats ─────────────────────────────────
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [topicsRes, statsRes] = await Promise.all([
          axios.get(`${PIPELINE_API}/events/topics`),
          axios.get(`${PIPELINE_API}/events/stats`),
        ]);
        setTopics(topicsRes.data);
        setStats(statsRes.data);
      } catch {}
    };
    fetchMeta();
    const timer = setInterval(fetchMeta, 5000);
    return () => clearInterval(timer);
  }, []);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  // ── Source toggle ─────────────────────────────────────────────────────────
  const toggleSource = (src: string) => {
    setSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  // ── Trigger collection ────────────────────────────────────────────────────
  const collect = async () => {
    if (!entity.trim()) return;
    setCollecting(true);
    try {
      await axios.post(`${PIPELINE_API}/entities`, {
        entity: entity.trim(),
        sources,
        count,
        once: true,
      });
    } catch (err) {
      console.error('Collection error:', err);
    } finally {
      setCollecting(false);
    }
  };

  // ── Filtered events ───────────────────────────────────────────────────────
  const filtered = events.filter(e => {
    if (topicFilter && e.topic !== topicFilter) return false;
    if (stageFilter && e.stage !== stageFilter) return false;
    return true;
  });

  const SOURCE_OPTIONS = ['youtube', 'news_rss', 'twitter', 'instagram'];
  const STAGES = ['collector', 'transformer', 'processor', 'consumer'];

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        <div className="nb-card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--am)' }}>
            {sseConnected ? '●' : '○'}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--sub)' }}>
            {sseConnected ? 'Live' : 'Polling'}
          </div>
        </div>
        <div className="nb-card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--bl)' }}>
            {stats?.total_events ?? 0}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--sub)' }}>Live Events</div>
        </div>
        <div className="nb-card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--gd)' }}>
            {stats ? Object.values(stats.platforms).reduce((a, b) => a + b, 0) : 0}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--sub)' }}>Items Processed</div>
        </div>
        <div className="nb-card text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--rd)' }}>
            {stats?.threats ?? 0}
          </div>
          <div className="text-[11px]" style={{ color: 'var(--sub)' }}>Threats</div>
        </div>
      </div>

      {/* ── Entity Collection Trigger ── */}
      <div className="nb-card">
        <h3 className="text-[13px] font-bold mb-3" style={{ color: 'var(--tx)' }}>
          🎯 Collect Intelligence
        </h3>
        <div className="flex gap-2 flex-wrap items-end">
          <div className="flex-1 min-w-48">
            <label className="text-[11px] mb-1 block" style={{ color: 'var(--sub)' }}>Entity / Person</label>
            <input
              className="w-full rounded-lg border px-3 py-2 text-[13px] bg-cd/50"
              style={{ borderColor: 'var(--bd)', color: 'var(--tx)' }}
              placeholder="e.g. Rahul Gandhi"
              value={entity}
              onChange={e => setEntity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && collect()}
            />
          </div>
          <div>
            <label className="text-[11px] mb-1 block" style={{ color: 'var(--sub)' }}>Count / Source</label>
            <input
              type="number"
              min={1} max={20}
              className="w-16 rounded-lg border px-2 py-2 text-[13px] bg-cd/50 text-center"
              style={{ borderColor: 'var(--bd)', color: 'var(--tx)' }}
              value={count}
              onChange={e => setCount(Number(e.target.value))}
            />
          </div>
          <div className="flex gap-1.5">
            {SOURCE_OPTIONS.map(src => (
              <button
                key={src}
                onClick={() => toggleSource(src)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all"
                style={{
                  background: sources.includes(src) ? 'var(--am)' : 'transparent',
                  borderColor: sources.includes(src) ? 'var(--am)' : 'var(--bd)',
                  color: sources.includes(src) ? '#fff' : 'var(--sub)',
                }}
              >
                {PLATFORM_ICONS[src]} {src === 'news_rss' ? 'News' : src.charAt(0).toUpperCase() + src.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={collect}
            disabled={!entity.trim() || collecting}
            className="nb-btn px-4 py-2 rounded-lg text-[13px] font-semibold disabled:opacity-50"
          >
            {collecting ? '⏳ Collecting...' : '🚀 Collect'}
          </button>
        </div>
      </div>

      {/* ── Live Feed Panel ── */}
      <div className="nb-card flex flex-col flex-1 min-h-0">
        {/* Controls */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <h3 className="text-[13px] font-bold flex-1" style={{ color: 'var(--tx)' }}>
            📡 Live Feed
            {sseConnected && (
              <span className="ml-2 text-[10px] font-normal" style={{ color: 'var(--gd)' }}>● LIVE</span>
            )}
          </h3>

          {/* Topic filter */}
          <select
            className="rounded-lg border px-2 py-1.5 text-[12px] bg-cd/50"
            style={{ borderColor: 'var(--bd)', color: 'var(--tx)' }}
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
          >
            <option value="">All Topics</option>
            {topics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Stage filter */}
          <div className="flex gap-1">
            {['', ...STAGES].map(s => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className="px-2 py-1 rounded text-[11px] font-medium"
                style={{
                  background: stageFilter === s ? STAGE_COLORS[s || 'unknown'] : 'transparent',
                  color: stageFilter === s ? '#fff' : 'var(--sub)',
                  opacity: stageFilter === s ? 1 : 0.7,
                }}
              >
                {s || 'All'}
              </button>
            ))}
          </div>

          {/* Auto-scroll */}
          <button
            onClick={() => setAutoScroll(p => !p)}
            className="text-[11px] px-2 py-1 rounded"
            style={{ color: autoScroll ? 'var(--am)' : 'var(--mn)' }}
          >
            {autoScroll ? '↑ Auto' : '⏸ Paused'}
          </button>

          {/* Clear */}
          <button
            onClick={async () => {
              await axios.delete(`${PIPELINE_API}/events`);
              setEvents([]);
            }}
            className="text-[11px] px-2 py-1 rounded"
            style={{ color: 'var(--mn)' }}
          >
            Clear
          </button>
        </div>

        {/* Event Cards */}
        <div
          ref={feedRef}
          className="flex flex-col gap-2 overflow-y-auto flex-1"
          style={{ maxHeight: '60vh' }}
        >
          {filtered.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--mn)' }}>
              <div className="text-3xl mb-2">📡</div>
              <div className="text-[13px]">Waiting for pipeline events...</div>
              <div className="text-[11px] mt-1">Use the Collect button to start ingestion</div>
            </div>
          ) : (
            filtered.map((evt, idx) => (
              <EventCard key={`${evt.timestamp}-${idx}`} event={evt} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event: e }: { event: PipelineEvent }) {
  const stageColor = STAGE_COLORS[e.stage] || 'var(--mn)';
  const sentColor = SENTIMENT_COLOR(e.sentiment_label);
  const icon = PLATFORM_ICONS[e.platform || ''] || '📌';
  const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : '';

  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        borderColor: e.is_threat ? 'var(--rd)' : 'var(--bd)',
        background: e.is_threat ? 'rgba(239,68,68,0.06)' : 'var(--cd)',
        borderLeft: `3px solid ${stageColor}`,
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[13px]">{icon}</span>
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase"
          style={{ background: stageColor + '22', color: stageColor }}
        >
          {e.stage}
        </span>
        {e.platform && (
          <span className="text-[11px]" style={{ color: 'var(--sub)' }}>{e.platform}</span>
        )}
        {e.author && (
          <span className="text-[11px] font-medium" style={{ color: 'var(--tx)' }}>@{e.author}</span>
        )}
        {e.topic && (
          <span
            className="ml-auto text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--am)22', color: 'var(--am)' }}
          >
            {e.topic}
          </span>
        )}
        <span className="text-[10px] ml-1" style={{ color: 'var(--mn)' }}>{time}</span>
      </div>

      {/* Text */}
      {e.text && (
        <p className="text-[12px] leading-relaxed mb-1.5" style={{ color: 'var(--sub)' }}>
          {e.text.slice(0, 200)}{e.text.length > 200 ? '…' : ''}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {e.sentiment_label && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{ background: sentColor + '22', color: sentColor }}
          >
            {e.sentiment_label} {e.sentiment !== undefined ? `(${e.sentiment.toFixed(2)})` : ''}
          </span>
        )}
        {e.topic_label && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bl)22', color: 'var(--bl)' }}>
            {e.topic_label}
          </span>
        )}
        {(e.entities || []).slice(0, 3).map((ent, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--am)11', color: 'var(--am)' }}>
            {ent}
          </span>
        ))}
        {e.is_threat && (
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'var(--rd)22', color: 'var(--rd)' }}>
            ⚠ THREAT
          </span>
        )}
        {e.event_type === 'error' && (
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--rd)22', color: 'var(--rd)' }}>
            ❌ {e.metadata?.error || 'Error'}
          </span>
        )}
      </div>
    </div>
  );
}
