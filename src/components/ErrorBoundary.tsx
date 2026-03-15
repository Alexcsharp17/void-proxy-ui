import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  declare props: Props;
  state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env?.DEV) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      const isDev = import.meta.env?.DEV;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main text-text-primary font-sans p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-semibold text-text-primary">
              Something went wrong
            </h1>
            <p className="text-sm text-text-secondary">
              An unexpected error occurred. Try refreshing the page.
            </p>
            {isDev && this.state.error && (
              <pre className="text-left text-xs text-text-muted bg-bg-panel p-4 rounded-lg overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-accent-primary text-white hover:opacity-90 transition-opacity"
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
