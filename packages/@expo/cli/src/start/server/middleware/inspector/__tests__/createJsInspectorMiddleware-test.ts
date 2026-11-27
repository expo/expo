import type { IncomingMessage, ServerResponse } from 'http';
import type { Socket } from 'net';
import { URL } from 'url';

import * as JsInspector from '../JsInspector';
import { createJsInspectorMiddleware } from '../createJsInspectorMiddleware';
import { METRO_INSPECTOR_RESPONSE_FIXTURE } from './fixtures/metroInspectorResponse';

jest.mock('../JsInspector');

describe('createJsInspectorMiddleware', () => {
  it('should return specific app entity for GET request with given applicationId', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0]!;
    const req = createRequest(`http://localhost:8081/inspector?applicationId=${app.description}`);
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(app));

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 200, JSON.stringify(app));
  });

  it('should handle ipv6 address', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0]!;
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

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
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

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 404);
  });

  it('should return 400 for GET request without parameters', async () => {
    const req = createRequest('http://localhost:8081/inspector');
    const res = createMockedResponse();
    const next = jest.fn();

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 400);
  });

  it('queries the local server origin even when the request URL is absolute-form', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0]!;
    const req = createRequest(
      `http://localhost:8081/_expo/debugger?applicationId=${app.description}`
    );
    req.url = `http://192.0.2.66:9010/_expo/debugger?applicationId=${app.description}`;
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(app));

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    expect(JsInspector.queryInspectorAppAsync).toHaveBeenCalledWith(
      'http://127.0.0.1:8081',
      expect.anything()
    );
  });

  it.each([
    ['a packager hostname override', 'http://192.168.1.20:8081'],
    ['a packager proxy URL', 'https://metro.example.com'],
  ])(
    'queries the inspector over loopback on the port Metro listens on, when serverBaseUrl is %s',
    async (_, serverBaseUrl) => {
      const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0]!;
      const req = createRequest(
        `http://localhost:8081/_expo/debugger?applicationId=${app.description}`
      );
      const res = createMockedResponse();
      const next = jest.fn();
      (
        JsInspector.queryInspectorAppAsync as jest.MockedFunction<
          typeof JsInspector.queryInspectorAppAsync
        >
      ).mockReturnValue(Promise.resolve(app));

      const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl });
      await middlewareAsync(req, res as ServerResponse, next);

      expect(JsInspector.queryInspectorAppAsync).toHaveBeenCalledWith(
        'http://127.0.0.1:8081',
        expect.anything()
      );
    }
  );

  it.each([
    ['an IPv6 local address', { localAddress: '::1' }, 'http://[::1]:8081'],
    ['a non-default IPv4 loopback', { localAddress: '127.0.0.2' }, 'http://127.0.0.2:8081'],
    ['an encrypted socket', { encrypted: true }, 'https://127.0.0.1:8081'],
  ])(
    'queries the inspector on the address and protocol the request arrived on, for %s',
    async (_, socket, metroOrigin) => {
      const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0]!;
      const req = createRequest(
        `http://localhost:8081/_expo/debugger?applicationId=${app.description}`,
        'GET',
        socket
      );
      const res = createMockedResponse();
      const next = jest.fn();
      (
        JsInspector.queryInspectorAppAsync as jest.MockedFunction<
          typeof JsInspector.queryInspectorAppAsync
        >
      ).mockReturnValue(Promise.resolve(app));

      const middlewareAsync = createJsInspectorMiddleware({
        serverBaseUrl: 'http://localhost:8081',
      });
      await middlewareAsync(req, res as ServerResponse, next);

      expect(JsInspector.queryInspectorAppAsync).toHaveBeenCalledWith(
        metroOrigin,
        expect.anything()
      );
    }
  );

  it('responds with 500 instead of rejecting when the inspector query fails', async () => {
    const req = createRequest('http://localhost:8081/_expo/debugger?applicationId=any');
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockRejectedValue(new TypeError('(intermediate value).reverse is not a function'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await expect(middlewareAsync(req, res as ServerResponse, next)).resolves.toBeUndefined();

    expectMockedResponse(res, 500);
  });

  it('rejects requests from a cross-origin browser page', async () => {
    const req = createRequest('http://localhost:8081/_expo/debugger?applicationId=any');
    req.headers.origin = 'http://evil.example';
    const res = createMockedResponse();
    const next = jest.fn();

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 403);
    expect(JsInspector.queryInspectorAppAsync).not.toHaveBeenCalled();
  });

  it('should set Content-Length to the byte length of the response, not its UTF-16 string length', async () => {
    const app = { ...METRO_INSPECTOR_RESPONSE_FIXTURE[0]!, deviceName: 'José’s iPhone 📱' };
    const req = createRequest(`http://localhost:8081/inspector?applicationId=${app.description}`);
    const res = createMockedResponse();
    const next = jest.fn();
    (
      JsInspector.queryInspectorAppAsync as jest.MockedFunction<
        typeof JsInspector.queryInspectorAppAsync
      >
    ).mockReturnValue(Promise.resolve(app));

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    const body = JSON.stringify(app);
    const headers = res.writeHead.mock.calls[0][1];
    expect(Number(headers['Content-Length'])).toBe(Buffer.byteLength(body, 'utf8'));
  });

  it('should open browser for PUT request with given applicationId', async () => {
    const app = METRO_INSPECTOR_RESPONSE_FIXTURE[0]!;
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

    const middlewareAsync = createJsInspectorMiddleware({ serverBaseUrl: 'http://localhost:8081' });
    await middlewareAsync(req, res as ServerResponse, next);

    expectMockedResponse(res, 200);
    expect(JsInspector.openJsInspector).toHaveBeenCalledTimes(1);
    expect(JsInspector.openJsInspector).toHaveBeenCalledWith('http://127.0.0.1:8081', app);
  });
});

function createRequest(
  requestUrl: string,
  method?: 'GET' | 'POST' | 'PUT',
  {
    remoteAddress = '127.0.0.1',
    localAddress = '127.0.0.1',
    encrypted,
  }: { remoteAddress?: string; localAddress?: string; encrypted?: boolean } = {}
): IncomingMessage {
  const url = new URL(requestUrl);
  const req: Partial<IncomingMessage> = {
    method: method || 'GET',
    headers: {
      host: url.host,
    },
    socket: {
      localAddress,
      localPort: Number(url.port || 80),
      remoteAddress,
      remoteFamily: 'IPv4',
      ...(encrypted !== undefined && { encrypted }),
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
