// miZan — Root Error Boundary with reload & raw backup export escape hatch
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { darija } from '../i18n/darija';
import { STORAGE_KEY } from '../types/finance';
import { downloadRawText } from '../storage/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Log error name/component stack only; never print user financial data
    console.error('Render failure:', error.name, info.componentStack?.slice(0, 200));
  }

  private handleExportRaw = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '{}';
      downloadRawText(raw, `mizan-emergency-backup-${Date.now()}.json`);
    } catch {
      // Ignore storage access failure during crash recovery
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-gray-50 flex items-center justify-center p-6"
        >
          <div className="bg-white rounded-2xl border p-6 max-w-md w-full space-y-4 text-center shadow-sm">
            <h1 className="text-lg font-bold text-gray-900">{darija.app.name}</h1>
            <p className="text-sm text-gray-600">{darija.errorBoundary.title}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 min-h-[44px]"
              >
                {darija.errorBoundary.reload}
              </button>
              <button
                type="button"
                onClick={this.handleExportRaw}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]"
              >
                {darija.errorBoundary.exportRaw}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
