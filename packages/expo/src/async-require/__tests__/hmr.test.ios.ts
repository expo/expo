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

vi.mock('../hmrUtils', () => ({
  getConnectionError: vi.fn(() => 'Cannot connect to Expo CLI.'),
  getFullBundlerUrl: vi.fn(() => 'http://localhost:8081/index.bundle?platform=ios'),
  handleCompileError: vi.fn(),
  hideLoading: vi.fn(),
  reload: vi.fn(),
  resetErrorOverlay: vi.fn(),
  showLoading: vi.fn(),
}));

vi.mock('@expo/metro/metro-runtime/modules/HMRClient', () => ({
  __esModule: true,
  default: class {
    on(event: string, handler: (...args: any[]) => void) {
      (listeners[event] ??= []).push(handler);
    }
    send = vi.fn();
    enable = vi.fn();
    disable = vi.fn();
    close = vi.fn();
    isEnabled = vi.fn(() => true);
    hasPendingUpdates = vi.fn(() => false);
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
