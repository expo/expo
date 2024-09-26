import nock from 'nock';

import {
  METRO_INSPECTOR_RESPONSE_FIXTURE,
  METRO_INSPECTOR_RESPONSE_FIXTURE_RN_74,
} from './fixtures/metroInspectorResponse';
import { pageIsSupported } from '../../../metro/debugging/pageIsSupported';
import {
  openJsInspector,
  queryAllInspectorAppsAsync,
  queryInspectorAppAsync,
} from '../JsInspector';
import { launchInspectorBrowserAsync } from '../LaunchBrowser';

jest.mock('fs-extra');
jest.mock('rimraf');

jest.mock('../LaunchBrowser');

describe(openJsInspector, () => {
  it('should open browser for PUT request with given app', async () => {
    const mockLaunchBrowserAsync = launchInspectorBrowserAsync as jest.MockedFunction<
      typeof launchInspectorBrowserAsync
    >;

    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0];
    await openJsInspector('http://localhost:8081', app);

    expect(mockLaunchBrowserAsync).toHaveBeenCalled();
  });
});

describe(queryAllInspectorAppsAsync, () => {
  it('should return all available app entities', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE);

    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE.filter(
      (app) => app.title === 'React Native Experimental (Improved Chrome Reloads)'
    );

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');

    expect(result.length).toBe(entities.length);
    for (let i = 0; i < result.length; ++i) {
      expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
      expect(result[i].description).not.toBe("don't use");
    }

    expect(scope.isDone()).toBe(true);
  });

  it('should return all available app entities for react native 0.74+', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE_RN_74);

    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE_RN_74.filter((app) => pageIsSupported(app));

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');
    expect(result.length).toBe(entities.length);
    for (let i = 0; i < result.length; ++i) {
      expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
      expect(result[i].description).not.toBe("don't use");
    }

    expect(scope.isDone()).toBe(true);
  });
});

describe(queryInspectorAppAsync, () => {
  it('should return specific app entity for given appId', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE);

    const appId = 'io.expo.test.devclient';
    const result = await queryInspectorAppAsync('http://localhost:8081', appId);

    expect(result?.description).toBe(appId);
    expect(scope.isDone()).toBe(true);
  });
});
