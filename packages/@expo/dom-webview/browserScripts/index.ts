import { ExpoDomWebView } from './ExpoDomWebView';

declare global {
  interface Window {
    ExpoDomWebView: ExpoDomWebView;
  }
}

window.ExpoDomWebView = new ExpoDomWebView();
