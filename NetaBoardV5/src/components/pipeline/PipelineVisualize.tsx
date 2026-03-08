// ═══ Pipeline Intel — Visualize (Pipeline Flowchart) ═══
// Renders a pipeline flow diagram from the pipeline API config.
// Uses a custom SVG-based layout (no reactflow dependency needed).

import { useState, useEffect } from 'react';
import axios from 'axios';

const PIPELINE_API = 'http://localhost:8500/api/v1';

interface NodeConfig {
  id: string;
  platform?: string;
  type?: string;
  enabled?: boolean;
  replicas?: number;
}

interface PipelineInfo {
  pipeline_id: string;
  config_path: string;
  status: 'running' | 'stopped';
  started_at?: string;
}

const NODE_COLORS: Record<string, string> = {
  collector:   'var(--am)',
  transformer: 'var(--bl)',
  processor:   'var(--em)',
  consumer:    'var(--gd)',
};

const NODE_ICONS: Record<string, string> = {
  collector:   '📥',
  transformer: '🔄',
  processor:   '⚙️',
  consumer:    '📤',
};

const PLATFORM_ICONS: Record<string, string> = {
  youtube:   '▶',
  twitter:   '𝕏',
  instagram: '📷',
  news_rss:  '📰',
  mock:      '🧪',
};

interface FlowNode {
  id: string;
  label: string;
  type: string;
  stage: string;
  enabled: boolean;
  replicas: number;
}

export default function PipelineVisualize() {
  const [pipelines, setPipelines] = useState<PipelineInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch pipeline list
  useEffect(() => {
    const fetchList = async () => {
      try {
        const res = await axios.get(`${PIPELINE_API}/pipelines`);
        const list: PipelineInfo[] = res.data;
        setPipelines(list);
        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].pipeline_id);
        }
      } catch {}
    };
    fetchList();
    const t = setInterval(fetchList, 5000);
    return () => clearInterval(t);
  }, [selectedId]);

  // Fetch selected pipeline detail
  useEffect(() => {
    if (!selectedId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${PIPELINE_API}/pipelines/${selectedId}`);
        setConfig(res.data);
      } catch {
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selectedId]);

  const currentPipeline = pipelines.find(p => p.pipeline_id === selectedId);

  const handleStart = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try { await axios.post(`${PIPELINE_API}/pipelines/${selectedId}/start`); } catch {}
    finally { setActionLoading(false); }
  };

  const handleStop = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try { await axios.post(`${PIPELINE_API}/pipelines/${selectedId}/stop`); } catch {}
    finally { setActionLoading(false); }
  };

  // Build node columns from config
  const stages: { key: string; nodes: FlowNode[] }[] = [
    { key: 'collector', nodes: [] },
    { key: 'transformer', nodes: [] },
    { key: 'processor', nodes: [] },
    { key: 'consumer', nodes: [] },
  ];

  if (config) {
    const raw = config.config || config;
    (raw.collectors || []).forEach((n: NodeConfig) =>
      stages[0].nodes.push({ id: n.id, label: n.platform || n.id, type: n.platform || n.id, stage: 'collector', enabled: n.enabled !== false, replicas: n.replicas || 1 })
    );
    (raw.transformers || []).forEach((n: NodeConfig) =>
      stages[1].nodes.push({ id: n.id, label: n.type || n.id, type: n.type || n.id, stage: 'transformer', enabled: n.enabled !== false, replicas: n.replicas || 1 })
    );
    (raw.processors || []).forEach((n: NodeConfig) =>
      stages[2].nodes.push({ id: n.id, label: n.type || n.id, type: n.type || n.id, stage: 'processor', enabled: n.enabled !== false, replicas: n.replicas || 1 })
    );
    (raw.consumers || []).forEach((n: NodeConfig) =>
      stages[3].nodes.push({ id: n.id, label: n.type || n.id, type: n.type || n.id, stage: 'consumer', enabled: n.enabled !== false, replicas: n.replicas || 1 })
    );
  }

  const topicLabels = ['raw-items', 'normalized-items', 'processed-items'];
  const isRunning = currentPipeline?.status === 'running';

  return (
    <div className="flex flex-col gap-4">
      {/* Pipeline selector + controls */}
      <div className="nb-card flex items-center gap-3 flex-wrap">
        <select
          className="flex-1 rounded-lg border px-3 py-2 text-[13px] bg-cd/50"
          style={{ borderColor: 'var(--bd)', color: 'var(--tx)' }}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">Select pipeline...</option>
          {pipelines.map(p => (
            <option key={p.pipeline_id} value={p.pipeline_id}>
              {p.pipeline_id} — {p.status}
            </option>
          ))}
        </select>

        {currentPipeline && (
          <span
            className="px-2 py-1 rounded text-[11px] font-bold"
            style={{
              background: isRunning ? 'var(--gd)22' : 'var(--mn)22',
              color: isRunning ? 'var(--gd)' : 'var(--mn)',
            }}
          >
            {isRunning ? '● Running' : '○ Stopped'}
            {currentPipeline.started_at && isRunning && (
              <span className="ml-1 font-normal">
                since {new Date(currentPipeline.started_at).toLocaleTimeString()}
              </span>
            )}
          </span>
        )}

        <button
          onClick={handleStart}
          disabled={!selectedId || isRunning || actionLoading}
          className="nb-btn px-3 py-1.5 rounded text-[12px] disabled:opacity-40"
        >
          ▶ Start
        </button>
        <button
          onClick={handleStop}
          disabled={!selectedId || !isRunning || actionLoading}
          className="px-3 py-1.5 rounded border text-[12px] disabled:opacity-40"
          style={{ borderColor: 'var(--rd)', color: 'var(--rd)' }}
        >
          ■ Stop
        </button>
      </div>

      {/* Flow diagram */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--mn)' }}>Loading pipeline...</div>
      ) : !config ? (
        <div className="nb-card text-center py-12" style={{ color: 'var(--mn)' }}>
          <div className="text-3xl mb-2">🔄</div>
          <div>Select a pipeline to visualize</div>
        </div>
      ) : (
        <div className="nb-card overflow-x-auto">
          <div className="flex items-stretch gap-0 min-w-max">
            {stages.map((stage, stageIdx) => {
              const color = NODE_COLORS[stage.key];
              const icon = NODE_ICONS[stage.key];
              const topicAfter = topicLabels[stageIdx];
              const isLast = stageIdx === stages.length - 1;

              return (
                <div key={stage.key} className="flex items-center">
                  {/* Stage column */}
                  <div className="flex flex-col items-center" style={{ minWidth: 180 }}>
                    {/* Stage header */}
                    <div
                      className="w-full text-center py-1 px-3 rounded-t-xl text-[11px] font-bold uppercase tracking-widest mb-2"
                      style={{ background: color + '22', color }}
                    >
                      {icon} {stage.key}
                    </div>

                    {/* Node cards */}
                    <div className="flex flex-col gap-2 w-full px-2">
                      {stage.nodes.length === 0 ? (
                        <div
                          className="rounded-xl p-3 border-dashed border text-center text-[11px]"
                          style={{ borderColor: 'var(--bd)', color: 'var(--mn)' }}
                        >
                          No nodes
                        </div>
                      ) : (
                        stage.nodes.map(node => (
                          <div
                            key={node.id}
                            className="rounded-xl p-3 border"
                            style={{
                              borderColor: node.enabled ? color : 'var(--bd)',
                              background: node.enabled ? color + '11' : 'var(--cd)',
                              opacity: node.enabled ? 1 : 0.5,
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[13px]">
                                {PLATFORM_ICONS[node.type] || icon}
                              </span>
                              <span className="text-[12px] font-bold" style={{ color }}>
                                {node.label}
                              </span>
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--mn)' }}>
                              ID: {node.id}
                              {node.replicas > 1 && ` × ${node.replicas}`}
                            </div>
                            {!node.enabled && (
                              <div className="text-[10px] mt-0.5" style={{ color: 'var(--mn)' }}>disabled</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Arrow + topic label between stages */}
                  {!isLast && (
                    <div className="flex flex-col items-center mx-3">
                      <div
                        className="text-[10px] px-2 py-0.5 rounded mb-1 text-center"
                        style={{ background: 'var(--sf)', color: 'var(--sub)' }}
                      >
                        {topicAfter}
                      </div>
                      <div style={{ color: 'var(--mn)', fontSize: 20 }}>→</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline metadata */}
      {config && (
        <div className="nb-card">
          <h4 className="text-[12px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Pipeline Info</h4>
          <div className="grid grid-cols-3 gap-3 text-[11px]" style={{ color: 'var(--sub)' }}>
            <div>
              <span className="font-medium">Config:</span> {config.config_path?.split('/').pop()}
            </div>
            <div>
              <span className="font-medium">Kafka:</span>{' '}
              {config.config?.kafka?.bootstrap_servers || 'memory'}
            </div>
            <div>
              <span className="font-medium">Entity:</span>{' '}
              {config.config?.pipeline?.entity || '—'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
