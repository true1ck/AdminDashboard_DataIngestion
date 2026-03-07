import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallbackModule?: string }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[NétaBoard Error] ${this.props.fallbackModule || 'Module'}:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="nb-card text-center py-8" style={{ border: '2px solid var(--rd)' }}>
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-sm font-bold" style={{ color: 'var(--rd)' }}>Something went wrong</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--sub)' }}>
            {this.props.fallbackModule && `Module: ${this.props.fallbackModule}`}
          </div>
          <div className="text-[10px] mt-2 px-4 py-2 rounded-md font-mono" style={{ background: 'var(--bg)', color: 'var(--mn)' }}>
            {this.state.error?.message}
          </div>
          <button className="nb-btn nb-btn-primary mt-3" onClick={() => this.setState({ hasError: false })}>
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
