import type { Archetype, FeedbackItem, SocialItem, Alert, Channel } from '../types';

const API_BASE = 'http://localhost:3000/api';

export const fetchArchetypes = async (): Promise<Archetype[]> => {
    const res = await fetch(`${API_BASE}/archetypes`);
    if (!res.ok) throw new Error('Failed to fetch archetypes');
    return res.json();
};

export const fetchFeedback = async (): Promise<FeedbackItem[]> => {
    const res = await fetch(`${API_BASE}/feedback`);
    if (!res.ok) throw new Error('Failed to fetch feedback');
    return res.json();
};

export const fetchSocial = async (): Promise<SocialItem[]> => {
    const res = await fetch(`${API_BASE}/social`);
    if (!res.ok) throw new Error('Failed to fetch social');
    return res.json();
};

export const fetchAlerts = async (): Promise<Alert[]> => {
    const res = await fetch(`${API_BASE}/alerts`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
};

export const fetchChannels = async (): Promise<Channel[]> => {
    const res = await fetch(`${API_BASE}/channels`);
    if (!res.ok) throw new Error('Failed to fetch channels');
    return res.json();
};

// ── Pipeline Intelligence API (port 8500) ──────────────────────────────────
const PIPELINE_API = 'http://localhost:8500/api/v1';

export const fetchPipelineEvents = async (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${PIPELINE_API}/events${qs}`);
    if (!res.ok) throw new Error('Failed to fetch pipeline events');
    return res.json();
};

export const fetchPipelineTopics = async (pipelineId?: string) => {
    const qs = pipelineId ? `?pipeline_id=${encodeURIComponent(pipelineId)}` : '';
    const res = await fetch(`${PIPELINE_API}/events/topics${qs}`);
    if (!res.ok) throw new Error('Failed to fetch topics');
    return res.json();
};

export const fetchPipelines = async () => {
    const res = await fetch(`${PIPELINE_API}/pipelines`);
    if (!res.ok) throw new Error('Failed to fetch pipelines');
    return res.json();
};

export const startPipeline = async (pipelineId: string) => {
    const res = await fetch(`${PIPELINE_API}/pipelines/${pipelineId}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start pipeline');
    return res.json();
};

export const stopPipeline = async (pipelineId: string) => {
    const res = await fetch(`${PIPELINE_API}/pipelines/${pipelineId}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop pipeline');
    return res.json();
};

export const triggerEntityCollection = async (
    entity: string,
    sources: string[],
    count: number,
    pipelineId?: string,
) => {
    const res = await fetch(`${PIPELINE_API}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, sources, count, pipeline_id: pipelineId, once: true }),
    });
    if (!res.ok) throw new Error('Failed to trigger collection');
    return res.json();
};
