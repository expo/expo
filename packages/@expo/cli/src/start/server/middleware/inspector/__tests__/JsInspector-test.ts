import nock from 'nock';

import { METRO_INSPECTOR_RESPONSE_FIXTURE } from './fixtures/metroInspectorResponse';
import { pageIsSupported } from '../../../metro/debugging/pageIsSupported';
import {
  openJsInspector,
  queryAllInspectorAppsAsync,
  queryInspectorAppAsync,
} from '../JsInspector';

jest.mock('../CdpClient');

describe(openJsInspector, () => {
  it('executes POST /open-debugger with the given app information', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0];

    // The URL parameters that should be sent for the inspectable target
    const params = new URLSearchParams();
    params.set('appId', app.description);
    params.set('device', app.reactNative!.logicalDeviceId!);
    params.set('target', app.id);

    const scope = nock('http://localhost:8081').post(`/open-debugger?${params}`).reply(200);
    await openJsInspector('http://localhost:8081', app);

    expect(scope.isDone()).toBe(true);
  });
});

describe(queryAllInspectorAppsAsync, () => {
  it('should return all available app entities', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE);

    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE.filter(pageIsSupported);

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');

    expect(result.length).toBe(entities.length);
    for (let i = 0; i < result.length; ++i) {
      expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
    }

    expect(scope.isDone()).toBe(true);
  });

  it('should return all available app entities for react native 0.74+', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE);

    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE.filter((app) => pageIsSupported(app));

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');
    expect(result.length).toBe(entities.length);
    for (let i = 0; i < result.length; ++i) {
      expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
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
