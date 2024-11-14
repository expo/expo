import nock from 'nock';

import { getExpoApiBaseUrl } from '../../../api/endpoint';
import * as ProjectDevices from '../../project/devices';
import { DevelopmentSession } from '../DevelopmentSession';

jest.mock('../../project/devices', () => ({
  getDevicesInfoAsync: jest.fn(),
}));
jest.mock('../../../api/user/user');

const originalEnvCI = process.env.CI;

describe(`startAsync`, () => {
  beforeEach(() => {
    delete process.env.CI;
    delete process.env.EXPO_OFFLINE;
  });

  afterEach(() => {
    process.env.CI = originalEnvCI;
  });

  it(`starts a dev session`, async () => {
    const session = new DevelopmentSession('/', 'http://localhost:19001/');

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }] as any[],
    });

    const exp = {
      name: 'my-app',
      slug: 'my-app',
      description: 'my-foo-bar',
      primaryColor: '#4630eb',
    };

    const runtime = 'native';
    const startScope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-alive?deviceId=123&deviceId=456')
      .reply(200, '');
    const closeScope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-close?deviceId=123&deviceId=456')
      .reply(200, '');

    await session.startAsync({
      exp,
      runtime,
    });

    await session.closeAsync();

    expect(ProjectDevices.getDevicesInfoAsync).toHaveBeenCalledTimes(2);
    expect(startScope.isDone()).toBe(true);
    expect(closeScope.isDone()).toBe(true);
  });

  it(`gracefully handles server outages`, async () => {
    const session = new DevelopmentSession('/', 'http://localhost:19001/');

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }] as any[],
    });

    const exp = {
      name: 'my-app',
      slug: 'my-app',
      description: 'my-foo-bar',
      primaryColor: '#4630eb',
    };
    const runtime = 'native';

    // Server is down
    nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-alive?deviceId=123&deviceId=456')
      .reply(500, '');

    // Does not throw directly
    await expect(
      session.startAsync({
        exp,
        runtime,
      })
    ).resolves.toBeUndefined();
  });

  it('is skipped on CI', async () => {
    process.env.CI = '1';

    const session = new DevelopmentSession('/', 'http://localhost:19001/');

    const runtime = 'native';
    const exp = {
      name: 'my-app',
      slug: 'my-app',
      description: 'my-foo-bar',
      primaryColor: '#4630eb',
    };

    // Does not throw directly
    await expect(session.startAsync({ exp, runtime })).resolves.toBeUndefined();

    // Did not load the current device info
    expect(ProjectDevices.getDevicesInfoAsync).not.toHaveBeenCalled();
  });
});

describe(`closeAsync`, () => {
  beforeEach(() => {
    delete process.env.CI;
    delete process.env.EXPO_OFFLINE;
  });

  afterEach(() => {
    process.env.CI = originalEnvCI;
  });

  it(`gracefully handles server outages`, async () => {
    const session = new DevelopmentSession('/', 'http://localhost:19001/');

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }] as any[],
    });

    // Server is down
    const closeScope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-close?deviceId=123&deviceId=456')
      .reply(500, '');

    // Fake the session state
    Object.assign(session, { hasActiveSession: true });

    // Does not throw directly
    await expect(session.closeAsync()).resolves.toBe(false);
    // Ensure the endpoint is called
    expect(closeScope.isDone()).toBe(true);
  });

  it('skips next close call when server is down', async () => {
    const session = new DevelopmentSession('/', 'http://localhost:19001/');

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }] as any[],
    });

    const server = jest.fn(() => '');

    // Server is down
    nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-close?deviceId=123&deviceId=456')
      .reply(500, server);

    // Fake the session state
    Object.assign(session, { hasActiveSession: true });

    // Does not throw directly
    await expect(session.closeAsync()).resolves.toBe(false);
    await expect(session.closeAsync()).resolves.toBe(false);
    await expect(session.closeAsync()).resolves.toBe(false);

    expect(server).toHaveBeenCalledTimes(1);
  });

  it('is skipped on CI', async () => {
    process.env.CI = '1';

    const session = new DevelopmentSession('/', 'http://localhost:19001/');

    // Does not throw directly
    await expect(session.closeAsync()).resolves.toBe(false);

    // Did not load the current device info
    expect(ProjectDevices.getDevicesInfoAsync).not.toHaveBeenCalled();
  });
});
