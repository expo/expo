export const WEBVIEW_BINDINGS =
  typeof window !== 'undefined' && typeof window.webkit !== 'undefined'
    ? {
        reload() {
          window.webkit.messageHandlers.reload.postMessage(null);
        },
        copy() {
          window.webkit.messageHandlers.copy.postMessage(null);
        },
        dismiss() {
          window.webkit.messageHandlers.dismiss.postMessage(null);
        },
        refresh(): Promise<NativeErrorInfo> {
          return new Promise((resolve) => {
            // Listen for window.dispatchEvent(new CustomEvent(\"$$dom_event\", { detail: errorInfoJson }));
            // from the native side of the webview

            const listener = (event) => {
              const errorInfo = event.detail;
              window.errorInfo = errorInfo;
              window.removeEventListener('$$dom_event', listener);
              resolve(errorInfo);
            };
            window.addEventListener('$$dom_event', listener);
            window.webkit.messageHandlers.refresh.postMessage(null);
          });
        },
      }
    : null;
