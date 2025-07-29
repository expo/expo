// @ts-ignore
import nock from 'nock';

import { queryAllInspectorAppsAsync } from '../CliJsInspector';
import { METRO_INSPECTOR_RESPONSE_FIXTURE } from './fixtures/metroInspectorResponse';

describe(queryAllInspectorAppsAsync, () => {
  it('should return all available app entities', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE);

    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE.reverse();

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

    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE.reverse();

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');
    expect(result.length).toBe(entities.length);
    for (let i = 0; i < result.length; ++i) {
      expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
    }

    expect(scope.isDone()).toBe(true);
  });
});
