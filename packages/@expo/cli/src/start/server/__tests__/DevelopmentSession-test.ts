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
    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

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
    expect(onDevSessionError).not.toBeCalled();
  });

  it(`surfaces exceptions that would otherwise be uncaught`, async () => {
    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

    jest
      .mocked(ProjectDevices.getDevicesInfoAsync)
      .mockRejectedValueOnce(new Error('predefined error'));

    const exp = {
      name: 'my-app',
      slug: 'my-app',
      description: 'my-foo-bar',
      primaryColor: '#4630eb',
    };
    const runtime = 'native';

    // Does not throw directly
    await session.startAsync({
      exp,
      runtime,
    });

    expect(onDevSessionError).toHaveBeenCalled();

    // Did not repeat the cycle
    expect(session['timeout']).toBe(null);
  });

  it(`gracefully handles server outages`, async () => {
    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

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
    await session.startAsync({
      exp,
      runtime,
    });

    expect(onDevSessionError).toHaveBeenCalled();

    // Did not repeat the cycle
    expect(session['timeout']).toBe(null);
  });

  it('is skipped on CI', async () => {
    process.env.CI = '1';

    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

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
    // Did not repeat the cycle
    expect(session['timeout']).toBe(null);
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

  it(`surfaces exceptions that would otherwise be uncaught`, async () => {
    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

    jest
      .mocked(ProjectDevices.getDevicesInfoAsync)
      .mockRejectedValueOnce(new Error('predefined error'));

    // Does not throw directly
    await expect(session.closeAsync()).resolves.toBe(false);

    // Calls the error handler
    expect(onDevSessionError).toHaveBeenCalled();
  });

  it(`gracefully handles server outages`, async () => {
    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }] as any[],
    });

    // Server is down
    nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-close?deviceId=123&deviceId=456')
      .reply(500, '');

    // Does not throw directly
    await expect(session.closeAsync()).resolves.toBe(false);

    // Calls the error handler
    expect(onDevSessionError).toHaveBeenCalled();
  });

  it('is skipped on CI', async () => {
    process.env.CI = '1';

    const onDevSessionError = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', onDevSessionError);

    // Does not throw directly
    await expect(session.closeAsync()).resolves.toBe(false);

    // Did not load the current device info
    expect(ProjectDevices.getDevicesInfoAsync).not.toHaveBeenCalled();
  });
});
