import HMRClient from '../hmr';
import { reload } from '../hmrUtils';

const listeners: Record<string, ((...args: any[]) => void)[]> = {};

function emit(event: string, ...args: any[]) {
  const handlers = listeners[event];
  if (!handlers?.length) {
    throw new Error(`No "${event}" handler was registered on the Metro HMR client`);
  }
  handlers.forEach((handler) => handler(...args));
}

jest.mock('../hmrUtils', () => ({
  getConnectionError: jest.fn(() => 'Cannot connect to Expo CLI.'),
  getFullBundlerUrl: jest.fn(() => 'http://localhost:8081/index.bundle?platform=ios'),
  handleCompileError: jest.fn(),
  hideLoading: jest.fn(),
  reload: jest.fn(),
  resetErrorOverlay: jest.fn(),
  showLoading: jest.fn(),
}));

jest.mock('@expo/metro/metro-runtime/modules/HMRClient', () => ({
  __esModule: true,
  default: class {
    on(event: string, handler: (...args: any[]) => void) {
      (listeners[event] ??= []).push(handler);
    }
    send = jest.fn();
    enable = jest.fn();
    disable = jest.fn();
    close = jest.fn();
    isEnabled = jest.fn(() => true);
    hasPendingUpdates = jest.fn(() => false);
  },
}));

it('reloads through the platform reload helper when an async bundle is registered after Metro disconnected', () => {
  HMRClient.setup('ios', 'index.bundle', 'localhost', 8081, true, 'http');

  // Metro's socket closes, which sets `hmrUnavailableReason`.
  emit('close', { code: 1006, reason: 'connection failed' });

  // An async chunk finishes loading afterwards. On native there is no
  // `window.location` unless `@expo/metro-runtime` is installed, so this must
  // not go through `window.location.reload()`.
  HMRClient.registerBundle('http://localhost:8081/AsyncScreen.bundle?platform=ios');

  expect(reload).toHaveBeenCalled();
});
