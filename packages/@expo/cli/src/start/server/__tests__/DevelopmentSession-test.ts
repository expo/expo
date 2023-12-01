import nock from 'nock';

import { getExpoApiBaseUrl } from '../../../api/endpoint';
import * as ProjectDevices from '../../project/devices';
import { DevelopmentSession } from '../DevelopmentSession';

jest.mock('../../project/devices', () => ({
  getDevicesInfoAsync: jest.fn(),
}));
jest.mock('../../../api/user/user');

describe(`startAsync`, () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });
  it(`starts a dev session`, async () => {
    const err = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', err);

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }],
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
    expect(err).not.toBeCalled();
  });

  it(`surfaces exceptions that would otherwise be uncaught`, async () => {
    const err = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', err);

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

    expect(err).toBeCalled();

    // Did not repeat the cycle
    expect(session['timeout']).toBe(null);
  });

  it(`gracefully handles server outages`, async () => {
    const err = jest.fn();
    const session = new DevelopmentSession('/', 'http://localhost:19001/', err);

    jest.mocked(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }],
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

    expect(err).toBeCalled();

    // Did not repeat the cycle
    expect(session['timeout']).toBe(null);
  });
});
