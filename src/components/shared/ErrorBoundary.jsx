import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6 text-center">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-gray-200 p-8 shadow-card flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-display font-black text-gray-900 text-lg">Something went wrong</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              An unexpected display error occurred. Tap below to reload the app.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-brand transition-all"
            >
              Reload Eldro+
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
