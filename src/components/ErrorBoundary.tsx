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
          className="min-h-screen bg-surface flex items-center justify-center p-6"
        >
          <div className="bg-card rounded-2xl border border-line p-6 max-w-md w-full space-y-4 text-center shadow-card">
            <h1 className="text-lg font-bold text-ink-900 flex items-center justify-center gap-1.5">
              <span>{darija.app.name}</span>
              <span aria-hidden="true">—</span>
              <bdi dir="ltr" className="text-brand-600">{darija.app.brandLatin}</bdi>
            </h1>
            <p className="text-sm text-ink-600">{darija.common.errorReload}</p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 min-h-[44px]"
              >
                {darija.common.reloadPage}
              </button>
              <button
                type="button"
                onClick={this.handleExportRaw}
                className="w-full py-3 px-4 border border-line text-ink-600 rounded-xl font-medium hover:bg-surface min-h-[44px]"
              >
                {darija.data.exportRaw}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
