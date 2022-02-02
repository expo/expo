import nock from 'nock';

import { getExpoApiBaseUrl } from '../../../utils/fetch-api';
import { constructDeepLink } from '../../serverUrl';
import * as ProjectDevices from '../ProjectDevices';
import { startDevSessionAsync, stopDevSession } from '../startDevSession';

const asMock = (fn: any): jest.Mock => fn as jest.Mock;
jest.mock('../ProcessSettings', () => {
  return {
    isOffline: false,
  };
});

jest.mock('../ProjectDevices', () => {
  return {
    getDevicesInfoAsync: jest.fn(),
  };
});
jest.mock('../../serverUrl', () => {
  return {
    constructDeepLink: jest.fn(),
  };
});
jest.mock('../../../utils/user/user', () => {
  return {
    getUserAsync: jest.fn(() => Promise.resolve({})),
  };
});

describe(startDevSessionAsync, () => {
  it(`starts a dev session`, async () => {
    asMock(ProjectDevices.getDevicesInfoAsync).mockResolvedValue({
      devices: [{ installationId: '123' }, { installationId: '456' }],
    });
    asMock(constructDeepLink).mockResolvedValue('http://localhost:19001/');

    const exp = {
      name: 'my-app',
      slug: 'my-app',
      description: 'my-foo-bar',
      primaryColor: '#4630eb',
    };
    const runtime = 'native';
    const scope = nock(getExpoApiBaseUrl())
      .post('/v2/development-sessions/notify-alive?deviceId=123&deviceId=456')
      .reply(200, '');

    await startDevSessionAsync('/test-project', {
      exp,
      runtime,
    });
    stopDevSession();
    expect(ProjectDevices.getDevicesInfoAsync).toHaveBeenCalledTimes(1);
    expect(scope.isDone()).toBe(true);
  });

  // TODO: Test bailing out, web session, polling.
});
