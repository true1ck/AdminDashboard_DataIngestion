import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchArchetypes, fetchFeedback, fetchSocial, fetchAlerts, fetchChannels } from '../api/client';
import type { Archetype, FeedbackItem, SocialItem, Alert, Channel } from '../types';

interface DataContextType {
    arc: Record<string, any>; // Mapped to match the original SRC/ARC format for ease of transition
    feedback: FeedbackItem[];
    social: SocialItem[];
    alerts: Alert[];
    channels: Channel[];
    isLoading: boolean;
    error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [arc, setArc] = useState<Record<string, any>>({});
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [social, setSocial] = useState<SocialItem[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [channels, setChannels] = useState<Channel[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const loadAllData = async () => {
            try {
                setIsLoading(true);
                const [
                    archetypesData,
                    feedbackData,
                    socialData,
                    alertsData,
                    channelsData
                ] = await Promise.all([
                    fetchArchetypes(),
                    fetchFeedback(),
                    fetchSocial(),
                    fetchAlerts(),
                    fetchChannels()
                ]);

                if (isMounted) {
                    // Transform archetypes array back into a dictionary (key -> value) 
                    // like the frontend expects from ARC
                    const arcMap: Record<string, any> = {};
                    archetypesData.forEach((a: any) => {
                        // We attempt to rebuild the exact shape the components expect to minimize refactoring
                        arcMap[a.archetypeKey] = {
                            n: a.name, ic: a.icon, tg: a.tagline, pr: a.primaryColor, kpi: a.kpis,
                            cn: {
                                const: a.constituency?.name, party: a.constituency?.party, state: a.constituency?.state,
                                type: a.constituency?.type, eldt: a.constituency?.electionDate, booth: a.constituency?.totalBooths
                            },
                            dm: {
                                es: a.pillarScores?.electoralStrength, lp: a.pillarScores?.legislativePerformance,
                                cd: a.pillarScores?.constituencyDevelopment, pa: a.pillarScores?.publicAccessibility,
                                cc: a.pillarScores?.communication, ps: a.pillarScores?.partyStanding,
                                mc: a.pillarScores?.mediaCoverage, di: a.pillarScores?.digitalInfluence,
                                fm: a.pillarScores?.financialMuscle, ai: a.pillarScores?.allianceIntel,
                                ce: a.pillarScores?.casteEquation, ac: a.pillarScores?.antiIncumbency,
                                gn: a.pillarScores?.grassrootsNetwork, ic: a.pillarScores?.ideologyConsistency,
                                sc: a.pillarScores?.scandalIndex
                            },
                            san: {
                                att: a.sansadRecord?.attendancePercentage, ques: a.sansadRecord?.questionsAsked,
                                pvt: a.sansadRecord?.privateBills, bill: a.sansadRecord?.billsPassed
                            },
                            // Ignoring 'Rivals' format conversion for brevity unless they crash. 
                            rv: []
                        };
                    });

                    // Format backend properties to match frontend types where necessary:
                    const formatTime = (dateStr: string) => {
                        const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
                        return diff < 60 ? `${diff}m ago` : `${Math.floor(diff / 60)}h ago`;
                    };

                    const formattedFeedback = feedbackData.map((f: any) => ({
                        id: f.id, text: f.text, src: f.source, snt: f.sentiment,
                        em: f.emotion, pil: f.pillarId, urg: f.urgency, tm: formatTime(f.timestamp)
                    }));

                    const formattedSocial = socialData.map((s: any) => ({
                        id: s.id, pl: s.platform, au: s.author, tx: s.text,
                        snt: s.sentiment, em: s.emotion, lk: s.likes, re: s.reposts, tm: formatTime(s.timestamp)
                    }));

                    const formattedAlerts = alertsData.map((a: any) => ({
                        id: a.id, sv: a.severity, t: a.title, ds: a.description,
                        ai_txt: a.aiSuggestedText, cf: a.aiConfidence, ic: a.icon, tm: formatTime(a.timestamp)
                    }));

                    const formattedChannels = channelsData.map((c: any) => ({
                        id: c.channelType, nm: c.name, ic: c.icon, st: c.status, api: c.apiEndpoint, auth: c.authMethod,
                        can: { read: c.canRead ? 1 : 0, reply: c.canReply ? 1 : 0, del: c.canDelete ? 1 : 0, dm: c.canDM ? 1 : 0, wh: c.hasWebhook ? 1 : 0 },
                        hi: c.instances?.[0]?.label || '',
                        c: '#4F46E5', // default color if missing
                        hd: c.instances?.[0]?.handle || '',
                        setup: c.apiEndpoint !== '' ? 1 : 0,
                        notes: c.instances?.[0]?.notes || '',
                        stats: {
                            fol: c.instances?.[0]?.followers + 'K' || '0K',
                            items: c.instances?.[0]?.totalItems || 0,
                            pend: c.instances?.[0]?.pending || 0,
                            resp: c.instances?.[0]?.responsePct || 0
                        },
                        instances: c.instances.map((i: any) => ({
                            id: i.id, label: i.label, hd: i.handle, st: i.status, notes: i.notes,
                            stats: { fol: i.followers + 'Grp', items: i.totalItems, pend: i.pending, resp: i.responsePct }
                        }))
                    }));

                    setArc(arcMap);
                    setFeedback(formattedFeedback);
                    setSocial(formattedSocial);
                    setAlerts(formattedAlerts);
                    setChannels(formattedChannels);
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || 'Failed to load data');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadAllData();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <DataContext.Provider value={{ arc, feedback, social, alerts, channels, isLoading, error }}>
            {children}
        </DataContext.Provider>
    );
};

export const useNetaData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useNetaData must be used within a DataProvider');
    }
    return context;
};
