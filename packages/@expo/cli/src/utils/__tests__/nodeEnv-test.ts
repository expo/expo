import { loadEnvFiles } from '../nodeEnv';

jest.mock('../interactive', () => ({
  shouldReduceLogs: () => false,
}));

jest.mock('2g', () => ({
  events: jest.fn(() => {
    const event = jest.fn();
    Object.assign(event, {
      path: jest.fn((value) => ({ toJSON: () => value })),
    });
    return event;
  }),
}));

describe(loadEnvFiles, () => {
  const originalEnv = process.env;
  const devGlobal = globalThis as typeof globalThis & { __DEV__?: boolean };
  const originalDev = devGlobal.__DEV__;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.__EXPO_ENV_LOADED;
  });

  afterAll(() => {
    process.env = originalEnv;
    devGlobal.__DEV__ = originalDev;
  });

  it('sets BABEL_ENV to match NODE_ENV', () => {
    process.env.NODE_ENV = 'development';
    process.env.BABEL_ENV = 'staging';

    loadEnvFiles('/app', { silent: true });

    expect(process.env.NODE_ENV).toBe('development');
    expect(process.env.BABEL_ENV).toBe('development');
  });
});
