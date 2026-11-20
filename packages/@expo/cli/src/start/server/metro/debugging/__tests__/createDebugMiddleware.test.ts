import { createDebugMiddleware } from '../createDebugMiddleware';

jest.mock('../../../../../utils/env', () => ({
  ...jest.requireActual('../../../../../utils/env'),
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
  delete process.env.EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR;
  createDevMiddleware.mockClear();
});

it('enables the Expo Network panel query param by default', () => {
  createDebugMiddleware({ serverBaseUrl: 'http://127.0.0.1:8081', reporter: {} as any });

  expect(experiments().enableNetworkInspector).toBe(true);
});

it('drops the Expo Network panel query param when using core network inspection', () => {
  process.env.EXPO_UNSTABLE_CORE_NETWORK_INSPECTOR = '1';
  createDebugMiddleware({ serverBaseUrl: 'http://127.0.0.1:8081', reporter: {} as any });

  expect(experiments().enableNetworkInspector).toBe(false);
});
