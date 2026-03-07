import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

export default function ServiceStatusBar() {
    const [health, setHealth] = useState<any>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const res = await axios.get(`${API_BASE}/health/all`);
                setHealth(res.data);
            } catch (e) {
                setHealth({
                    backend: 'offline',
                    frontend: 'online',
                    qwen: 'offline',
                    whisper: 'offline'
                });
            }
        };
        fetchHealth();
        const timer = setInterval(fetchHealth, 10000);
        return () => clearInterval(timer);
    }, []);

    if (!health) return null;

    const services = [
        { key: 'backend', label: 'BE', icon: '⚙️' },
        { key: 'qwen', label: 'QN', icon: '🧠' },
        { key: 'whisper', label: 'WH', icon: '🎧' },
    ];

    return (
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg border border-bd bg-cd/50">
            {services.map(s => {
                const statusType = health[s.key];
                const statusColor = statusType === 'online' ? 'var(--em)' : statusType === 'offline' ? 'var(--rd)' : 'var(--mn)';
                return (
                    <div key={s.key} className="flex items-center gap-1.5" title={`${s.label}: ${statusType}`}>
                        <span className="w-1.5 h-1.5 rounded-full"
                            style={{
                                background: statusColor,
                                boxShadow: statusType === 'online' ? `0 0 6px ${statusColor}` : 'none',
                                animation: statusType === 'online' ? 'pulse 2s infinite' : 'none'
                            }} />
                        <span className="text-[10px] font-bold text-mn tracking-tighter">{s.label}</span>
                    </div>
                );
            })}
        </div>
    );
}
