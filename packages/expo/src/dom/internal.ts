import type { useClient } from './use-client';

const _useClient: typeof useClient = () => {
  throw new Error('useClient can only be used in a web environment');
};

export { default as WebView } from './webview-wrapper';
export { _useClient as useClient };
export { WebContext } from './web-context';
