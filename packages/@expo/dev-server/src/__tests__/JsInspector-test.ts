import { ChildProcess } from 'child_process';
import fetch from 'node-fetch';
import open from 'open';

import {
  openJsInspector,
  queryAllInspectorAppsAsync,
  queryInspectorAppAsync,
} from '../JsInspector';
import { METRO_INSPECTOR_RESPONSE_FIXTURE } from '../__tests__/fixtures/metroInspectorResponse';

jest.mock('fs-extra');
jest.mock('node-fetch');
jest.mock('open');
jest.mock('rimraf');
jest.mock('temp-dir', () => '/tmp');

const { Response } = jest.requireActual('node-fetch');

describe(openJsInspector, () => {
  it('should open browser for PUT request with given app', async () => {
    const mockOpen = open.openApp as jest.MockedFunction<typeof open.openApp>;
    mockOpen.mockImplementation(
      (): Promise<ChildProcess> => {
        const result: Partial<ChildProcess> = { exitCode: 0 };
        return Promise.resolve(result as ChildProcess);
      }
    );

    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0];
    openJsInspector(app);
  });
});

describe(queryAllInspectorAppsAsync, () => {
  it('should return all available app entities', async () => {
    const entities = METRO_INSPECTOR_RESPONSE_FIXTURE.filter(
      app => app.title === 'React Native Experimental (Improved Chrome Reloads)'
    );

    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockReturnValue(
      Promise.resolve(new Response(JSON.stringify(METRO_INSPECTOR_RESPONSE_FIXTURE)))
    );

    const result = await queryAllInspectorAppsAsync('http://localhost:8081');
    expect(result.length).toBe(entities.length);
    for (let i = 0; i < result.length; ++i) {
      expect(result[i].webSocketDebuggerUrl).toBe(entities[i].webSocketDebuggerUrl);
      expect(result[i].description).not.toBe("don't use");
    }
  });
});

describe(queryInspectorAppAsync, () => {
  it('should return specific app entity for given appId', async () => {
    const appId = 'io.expo.test.devclient';
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockReturnValue(
      Promise.resolve(new Response(JSON.stringify(METRO_INSPECTOR_RESPONSE_FIXTURE)))
    );

    const result = await queryInspectorAppAsync('http://localhost:8081', appId);
    expect(result?.description).toBe(appId);
  });
});
