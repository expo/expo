// @ts-ignore
import nock from 'nock';

import { queryAllInspectorAppsAsync } from '../CliJSInspector';
import { METRO_INSPECTOR_RESPONSE_FIXTURE } from './fixtures/metroInspectorResponse';

describe(queryAllInspectorAppsAsync, () => {
  it('should return all inspectable app entities', async () => {
    const scope = nock('http://localhost:8081')
      .get('/json/list')
      .reply(200, METRO_INSPECTOR_RESPONSE_FIXTURE);

    METRO_INSPECTOR_RESPONSE_FIXTURE.reverse();

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');

    expect(result.length).toBe(1);
    expect(scope.isDone()).toBe(true);
  });
});
