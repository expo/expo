import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { URL } from 'url';

import { METRO_INSPECTOR_RESPONSE_FIXTURE } from './fixtures/metroInspectorResponse';
import * as JsInspector from '../JsInspector';
import { createJsInspectorMiddleware } from '../createJsInspectorMiddleware';

jest.mock('../JsInspector');

describe('createJsInspectorMiddleware', () => {
  it('should return specific app entity for GET request with given applicationId', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0];
    const req = createRequest(`http://localhost:8081/inspector?applicationId=${app.description}`);
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(app));

    const middlewareAsync = createJsInspectorMiddleware();
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 200, JSON.stringify(app));
  });

  it('should handle ipv6 address', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0];
    const req = createRequest(
      `http://[::ffff:127.0.0.1]/inspector?applicationId=${app.description}`
    );
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(app));

    const middlewareAsync = createJsInspectorMiddleware();
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 200, JSON.stringify(app));
  });

  it('should return 404 for GET request with nonexistent applicationId', async () => {
    const req = createRequest('http://localhost:8081/inspector?applicationId=nonExistentApp');
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(null));

    const middlewareAsync = createJsInspectorMiddleware();
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 404);
  });

  it('should return 400 for GET request without parameters', async () => {
    const req = createRequest('http://localhost:8081/inspector');
    const res = createMockedResponse();
    const next = jest.fn();

    const middlewareAsync = createJsInspectorMiddleware();
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 400);
  });

  it('should open browser for PUT request with given applicationId', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0];
    const req = createRequest(
      `http://localhost:8081/inspector?applicationId=${app.description}`,
      'PUT'
    );
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(app));

    const middlewareAsync = createJsInspectorMiddleware();
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 200);
    expect(JsInspector.openJsInspector).toHaveBeenCalledTimes(1);
  });
});

function createRequest(requestUrl: string, method?: 'GET' | 'POST' | 'PUT'): IncomingMessage {
  const url = new URL(requestUrl);
  const req: Partial<IncomingMessage> = {
    method: method || 'GET',
    headers: {
      host: url.host,
    },
    socket: {
      localAddress: url.hostname,
      localPort: Number(url.port || 80),
    } as Socket,
    url: `${url.pathname}${url.search}`,
  };
  return req as IncomingMessage;
}

interface MockedResponse extends Partial<ServerResponse> {
  end: jest.Mock;
  writeHead: jest.Mock;
  write: jest.Mock;
}

function createMockedResponse(): MockedResponse {
  return {
    end: jest.fn(),
    writeHead: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
  };
}

function expectMockedResponse(res: MockedResponse, status: number, body?: string) {
  if (status !== 200) {
    expect(res.writeHead.mock.calls[0][0]).toBe(status);
  }
  if (body) {
    expect(res.end.mock.calls[0][0]).toBe(body);
  }
}
