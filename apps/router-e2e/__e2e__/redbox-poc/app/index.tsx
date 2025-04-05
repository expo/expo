import React, { useEffect } from 'react';
import '../global.css';

const WEBVIEW_BINDINGS = {
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
};

type NativeErrorInfo = {
  errorMessage: string;
  stack: {
    collapse: boolean;
    column: number;
    file: string;
    lineNumber: number;
    methodName: string;
  }[];
};

function useNativeError(): NativeErrorInfo | undefined {
  const [error, setError] = React.useState(window.errorInfo);
  useEffect(() => {
    const listener = (event) => {
      const errorInfo = event.detail;
      setError(errorInfo);
    };
    window.addEventListener('$$dom_event', listener);
    if (!window.errorInfo) {
      window.webkit.messageHandlers.refresh.postMessage(null);
    }
    return () => {
      window.removeEventListener('$$dom_event', listener);
    };
  }, []);

  return error;
}

export default function Page() {
  useEffect(() => {
    // Inject an attribute in the HTML to indicate to the CSS that this app is running in a webview
    const html = document.querySelector('html');
    if (html) {
      html.setAttribute('data-webview', 'true');
    }
  }, []);

  return <div />;
}
