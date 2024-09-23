import { ExpoDomWebView } from './ExpoDomWebView';

declare global {
  interface Window {
    ExpoDomWebView: ExpoDomWebView;
    ExpoDomWebViewBridge: {
      eval: (args: string) => string;
    };
  }
}

window.ExpoDomWebView = new ExpoDomWebView();
