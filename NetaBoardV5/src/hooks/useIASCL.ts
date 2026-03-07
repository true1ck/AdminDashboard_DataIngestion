// ═══ S1.1 — IASCL State Machine Hook ═══
import { useReducer, useCallback } from 'react';

export type IASCLState =
  | 'draft' | 'dispatched' | 'acknowledged' | 'in_progress'
  | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  | 'revision_requested' | 'closed' | 'cancelled';

export interface Criterion { id: string; text: string; is_mandatory: boolean; is_met: boolean; met_at: string | null }
export interface Transition { from: string | null; to: string; by: string; ts: string; note: string }

export interface IASCLAction {
  id: string; uid: string; alert_id: string; trigger_module: string;
  action_text: string; status: IASCLState;
  priority: string | null; urgency_hours: number | null; deadline: string | null;
  assignee: string | null; reviewer: string | null;
  criteria: Criterion[]; criteria_count: number; criteria_met_count: number; completion_pct: number;
  transitions: Transition[]; history: { status: string; ts: string }[];
  outcome: string | null; closed_at: string | null; cancellation_reason: string | null;
  pillar_impact: { key: string; delta: number }[] | null; karma_points: number | null;
  created_at: string; version: number;
}

const TRANS: Record<string, IASCLState[]> = {
  draft: ['dispatched'], dispatched: ['acknowledged', 'cancelled'],
  acknowledged: ['in_progress', 'cancelled'], in_progress: ['submitted', 'cancelled'],
  submitted: ['under_review'], under_review: ['accepted', 'rejected', 'revision_requested'],
  rejected: ['in_progress'], revision_requested: ['in_progress'],
  accepted: ['closed'], closed: [], cancelled: [],
};

const SLA: Record<string, number> = { tatkal: 4, atyavashy: 24, samayik: 168, niyamit: 720 };

type Action =
  | { type: 'CREATE'; payload: { alertId: string; module: string; text?: string } }
  | { type: 'TRANSITION'; payload: { id: string; to: IASCLState; meta?: Record<string, unknown> } }
  | { type: 'SET_PRIORITY'; payload: { id: string; priority: string } }
  | { type: 'ADD_CRITERION'; payload: { id: string; text: string; mandatory?: boolean } }
  | { type: 'VERIFY_CRITERION'; payload: { actionId: string; criterionId: string; met: boolean } }
  | { type: 'DISPATCH_FROM_ALERT'; payload: { alertId: string; label: string; urg: string; criteria: string[]; assignee: string } };

interface State { actions: Record<string, IASCLAction>; counter: number }

function reducer(state: State, action: Action): State {
  const now = new Date().toISOString();
  switch (action.type) {
    case 'CREATE': {
      const uid = `ACT-2026-${String(state.counter + 1).padStart(5, '0')}`;
      const id = `ia_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const a: IASCLAction = {
        id, uid, alert_id: action.payload.alertId, trigger_module: action.payload.module,
        action_text: action.payload.text || '', status: 'draft',
        priority: null, urgency_hours: null, deadline: null,
        assignee: null, reviewer: null,
        criteria: [], criteria_count: 0, criteria_met_count: 0, completion_pct: 0,
        transitions: [{ from: null, to: 'draft', by: 'system', ts: now, note: 'Created' }],
        history: [{ status: 'draft', ts: now }],
        outcome: null, closed_at: null, cancellation_reason: null,
        pillar_impact: null, karma_points: null,
        created_at: now, version: 1,
      };
      return { actions: { ...state.actions, [id]: a }, counter: state.counter + 1 };
    }
    case 'TRANSITION': {
      const a = state.actions[action.payload.id];
      if (!a) return state;
      const valid = TRANS[a.status] || [];
      if (!valid.includes(action.payload.to)) return state;
      // Mandatory criteria check for 'accepted'
      if (action.payload.to === 'accepted') {
        const unmet = a.criteria.filter(c => c.is_mandatory && !c.is_met);
        if (unmet.length > 0) return state;
      }
      const meta = (action.payload.meta || {}) as Record<string, string>;
      if (action.payload.to === 'cancelled' && (!meta.reason || meta.reason.length < 10)) return state;
      const updated: IASCLAction = {
        ...a, status: action.payload.to, version: a.version + 1,
        transitions: [...a.transitions, { from: a.status, to: action.payload.to, by: meta.by || 'user', ts: now, note: meta.note || '' }],
        history: [...a.history, { status: action.payload.to, ts: now }],
        ...(action.payload.to === 'dispatched' ? { assignee: meta.assignee || 'Self', action_text: meta.action_text || a.action_text } : {}),
        ...(action.payload.to === 'closed' ? (() => {
          const impacts = (meta.impacts as unknown as { key: string; delta: number }[] | undefined) || [{ key: 'cd', delta: 2 }, { key: 'pa', delta: 1 }];
          const karma = Math.round(impacts.reduce((s, imp) => s + imp.delta, 0) * 1.5);
          return { outcome: meta.outcome || 'Resolved', closed_at: now, pillar_impact: impacts, karma_points: karma };
        })() : {}),
        ...(action.payload.to === 'cancelled' ? { cancellation_reason: meta.reason } : {}),
      };
      return { actions: { ...state.actions, [a.id]: updated }, counter: state.counter };
    }
    case 'SET_PRIORITY': {
      const a = state.actions[action.payload.id];
      if (!a) return state;
      const hours = SLA[action.payload.priority] || 168;
      const dl = new Date(); dl.setHours(dl.getHours() + hours);
      return { actions: { ...state.actions, [a.id]: { ...a, priority: action.payload.priority, urgency_hours: hours, deadline: dl.toISOString() } }, counter: state.counter };
    }
    case 'ADD_CRITERION': {
      const a = state.actions[action.payload.id];
      if (!a || a.criteria.length >= 10) return state;
      const c: Criterion = { id: `cr_${a.criteria.length + 1}`, text: action.payload.text, is_mandatory: action.payload.mandatory !== false, is_met: false, met_at: null };
      const updated = { ...a, criteria: [...a.criteria, c], criteria_count: a.criteria.length + 1 };
      return { actions: { ...state.actions, [a.id]: updated }, counter: state.counter };
    }
    case 'VERIFY_CRITERION': {
      const a = state.actions[action.payload.actionId];
      if (!a) return state;
      const criteria = a.criteria.map(c => c.id === action.payload.criterionId ? { ...c, is_met: action.payload.met, met_at: action.payload.met ? now : null } : c);
      const metCount = criteria.filter(c => c.is_met).length;
      return { actions: { ...state.actions, [a.id]: { ...a, criteria, criteria_met_count: metCount, completion_pct: criteria.length > 0 ? Math.round(metCount / criteria.length * 100) : 0 } }, counter: state.counter };
    }
    case 'DISPATCH_FROM_ALERT': {
      const { alertId, label, urg, criteria, assignee } = action.payload;
      const uid = `ACT-2026-${String(state.counter + 1).padStart(5, '0')}`;
      const id = `ia_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const hours = SLA[urg] || 168;
      const dl = new Date(); dl.setHours(dl.getHours() + hours);
      const crits: Criterion[] = criteria.map((t, i) => ({ id: `cr_${i + 1}`, text: t, is_mandatory: true, is_met: false, met_at: null }));
      const a: IASCLAction = {
        id, uid, alert_id: alertId, trigger_module: 'dispatch',
        action_text: label, status: 'dispatched',
        priority: urg, urgency_hours: hours, deadline: dl.toISOString(),
        assignee, reviewer: null,
        criteria: crits, criteria_count: crits.length, criteria_met_count: 0, completion_pct: 0,
        transitions: [{ from: null, to: 'draft', by: 'system', ts: now, note: 'Created' }, { from: 'draft', to: 'dispatched', by: 'user', ts: now, note: `Dispatched: ${label}` }],
        history: [{ status: 'draft', ts: now }, { status: 'dispatched', ts: now }],
        outcome: null, closed_at: null, cancellation_reason: null,
        pillar_impact: null, karma_points: null,
        created_at: now, version: 2,
      };
      return { actions: { ...state.actions, [id]: a }, counter: state.counter + 1 };
    }
    default: return state;
  }
}

// Seed 3 demo actions matching HTML
function createInitialState(): State {
  const now = new Date().toISOString();
  const mk = (uid: string, aid: string, txt: string, st: IASCLState, pri: string, asn: string, crits: { t: string; met: boolean }[], cnt: number): IASCLAction => ({
    id: `ia_seed_${cnt}`, uid, alert_id: aid, trigger_module: 'alerts', action_text: txt, status: st,
    priority: pri, urgency_hours: SLA[pri] || 4, deadline: now,
    assignee: asn, reviewer: null,
    criteria: crits.map((c, i) => ({ id: `cr_${i + 1}`, text: c.t, is_mandatory: true, is_met: c.met, met_at: c.met ? now : null })),
    criteria_count: crits.length, criteria_met_count: crits.filter(c => c.met).length,
    completion_pct: crits.length > 0 ? Math.round(crits.filter(c => c.met).length / crits.length * 100) : 0,
    transitions: [{ from: null, to: 'draft', by: 'system', ts: now, note: 'Created' }],
    history: [{ status: 'draft', ts: now }, { status: st, ts: now }],
    outcome: null, closed_at: null, cancellation_reason: null,
    pillar_impact: null, karma_points: null, created_at: now, version: 2,
  });

  const a1 = mk('ACT-2026-00001', 'a1', 'Crisis response for viral video', 'acknowledged', 'tatkal', 'PR Head',
    [{ t: 'Issue public statement within 2h', met: false }, { t: 'Assign crisis team lead', met: false }, { t: 'Monitor sentiment hourly', met: false }], 1);
  const a2 = mk('ACT-2026-00002', 'a2', 'EC expenditure response', 'dispatched', 'atyavashy', 'Legal Advisor',
    [{ t: 'File response with receipts', met: false }, { t: 'Notify legal cell', met: false }], 2);
  const a3 = mk('ACT-2026-00003', 'a3', 'Deepfake audio response', 'in_progress', 'tatkal', 'Cyber Cell',
    [{ t: 'File FIR within 4h', met: true }, { t: 'File platform takedown', met: false }, { t: 'Brief party legal cell', met: false }], 3);

  return { actions: { [a1.id]: a1, [a2.id]: a2, [a3.id]: a3 }, counter: 3 };
}

export function useIASCL() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);

  const create = useCallback((alertId: string, module: string, text?: string) => {
    dispatch({ type: 'CREATE', payload: { alertId, module, text } });
  }, []);

  const transition = useCallback((id: string, to: IASCLState, meta?: Record<string, unknown>) => {
    dispatch({ type: 'TRANSITION', payload: { id, to, meta } });
  }, []);

  const setPriority = useCallback((id: string, priority: string) => {
    dispatch({ type: 'SET_PRIORITY', payload: { id, priority } });
  }, []);

  const addCriterion = useCallback((id: string, text: string, mandatory?: boolean) => {
    dispatch({ type: 'ADD_CRITERION', payload: { id, text, mandatory } });
  }, []);

  const verifyCriterion = useCallback((actionId: string, criterionId: string, met: boolean) => {
    dispatch({ type: 'VERIFY_CRITERION', payload: { actionId, criterionId, met } });
  }, []);

  const dispatchFromAlert = useCallback((alertId: string, label: string, urg: string, criteria: string[], assignee: string) => {
    dispatch({ type: 'DISPATCH_FROM_ALERT', payload: { alertId, label, urg, criteria, assignee } });
  }, []);

  const actions = Object.values(state.actions);
  const activeActions = actions.filter(a => !['closed', 'cancelled'].includes(a.status));
  const stats = {
    total: actions.length,
    active: activeActions.length,
    closed: actions.filter(a => a.status === 'closed').length,
    cancelled: actions.filter(a => a.status === 'cancelled').length,
    breached: 0,
  };

  const getValidTransitions = useCallback((status: IASCLState): IASCLState[] => TRANS[status] || [], []);

  return { actions, activeActions, stats, create, transition, setPriority, addCriterion, verifyCriterion, dispatchFromAlert, getValidTransitions };
}
