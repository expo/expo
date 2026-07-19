import ExpoDomWebViewModule from './ExpoDomWebViewModule';

export function evalJsForWebViewAsync(webViewId: number, source: string): void {
  ExpoDomWebViewModule.evalJsForWebViewAsync(webViewId, source);
}
