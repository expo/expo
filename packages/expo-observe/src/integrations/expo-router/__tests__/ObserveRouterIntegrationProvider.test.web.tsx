import { render } from '@testing-library/react-native';

import { ObserveRouterIntegrationProvider } from '../ObserveRouterIntegrationProvider';
import * as initModule from '../init';

jest.mock('../init', () => ({
  __esModule: true,
  isInitialized: jest.fn(() => true),
  initListeners: jest.fn(() => jest.fn()),
  initRouterIntegration: jest.fn(),
}));

jest.mock('../router', () => ({
  optionalRouter: { unstable_PerformanceObserver: jest.fn() },
  isRouterInstalled: true,
}));

const mockInitListeners = initModule.initListeners as jest.Mock;

function renderProvider() {
  return render(<ObserveRouterIntegrationProvider />);
}

// The Node jest project has no `window`, which is the server-rendering case; the Web project runs
// under jsdom, which is the browser case.
if (typeof window === 'undefined') {
  it('does not subscribe to navigation events when rendered on the server', async () => {
    await renderProvider();
    expect(mockInitListeners).not.toHaveBeenCalled();
  });
} else {
  it('subscribes to navigation events in the browser', async () => {
    await renderProvider();
    expect(mockInitListeners).toHaveBeenCalledTimes(1);
  });
}
