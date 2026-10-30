import { env } from '../../../../../utils/env';
import { createDebugMiddleware } from '../createDebugMiddleware';

jest.mock('../../../../../utils/env', () => ({
  env: {
    EXPO_DEBUG: false,
    EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR: false,
  },
  envIsHeadless: () => true,
}));

jest.mock('@react-native/dev-middleware', () => ({
  createDevMiddleware: jest.fn(() => ({
    middleware: jest.fn(),
    websocketEndpoints: {
      '/inspector/debug': { on: jest.fn() },
    },
  })),
}));

const { createDevMiddleware } = jest.requireMock('@react-native/dev-middleware') as {
  createDevMiddleware: jest.Mock;
};

function experiments() {
  return createDevMiddleware.mock.calls.at(-1)?.[0].unstable_experiments;
}

beforeEach(() => {
  env.EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR = false;
  createDevMiddleware.mockClear();
});

it('enables the Expo Network panel query param by default', () => {
  createDebugMiddleware({ serverBaseUrl: 'http://127.0.0.1:8081', reporter: {} as any });

  expect(experiments().enableNetworkInspector).toBe(true);
});

it('drops the Expo Network panel query param when using core network inspection', () => {
  env.EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR = true;
  createDebugMiddleware({ serverBaseUrl: 'http://127.0.0.1:8081', reporter: {} as any });

  expect(experiments().enableNetworkInspector).toBe(false);
});
