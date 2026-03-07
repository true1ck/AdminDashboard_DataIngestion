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
