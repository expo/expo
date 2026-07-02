import { vol } from 'memfs';
import { Writable } from 'stream';

import DevToolsPluginManager from '../../DevToolsPluginManager';
import { DevToolsPluginMiddleware } from '../DevToolsPluginMiddleware';
import type { ServerRequest, ServerResponse } from '../server.types';

jest.mock('fs/promises');

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

class MockDevToolsPluginManager extends DevToolsPluginManager {
  queryPluginsAsync = jest.fn().mockResolvedValue([]);
  queryPluginAsync = jest.fn().mockResolvedValue(null);
}

function createMiddleware(devToolsPluginManager = new MockDevToolsPluginManager('/')) {
  return new DevToolsPluginMiddleware('/', devToolsPluginManager);
}

function createMockResponse() {
  return {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    emit: jest.fn(),
    end: jest.fn(),
    statusCode: 200,
  } as unknown as ServerResponse;
}

async function delayAsync(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A writable response mock that supports streaming Response bodies from the plugin server. */
function createStreamingResponse() {
  const chunks: Buffer[] = [];
  const res = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  Object.assign(res, {
    getHeader: jest.fn(),
    setHeader: jest.fn(),
    statusCode: 200,
    body: () => Buffer.concat(chunks).toString(),
  });
  return res as unknown as ServerResponse & { body(): string };
}

function createServerRequest(url: string): ServerRequest {
  return asReq({
    url,
    method: 'GET',
    headers: { host: 'localhost:8081' },
    rawHeaders: ['host', 'localhost:8081'],
    socket: {} as any,
    once: jest.fn() as any,
  });
}

describe(DevToolsPluginMiddleware, () => {
  it('handleRequestAsync should return index.html from a matched plugin', async () => {
    const devToolsPluginManager = new MockDevToolsPluginManager('/');
    devToolsPluginManager.queryPluginAsync.mockResolvedValue({
      packageName: 'hello-plugin',
      packageRoot: '/root/packages/hello-plugin',
      webpageRoot: '/root/packages/hello-plugin/dist',
    });
    vol.fromJSON({
      '/root/packages/hello-plugin/dist/index.html': '<html></html>',
    });

    const middleware = createMiddleware(devToolsPluginManager);
    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/plugins/hello-plugin',
        headers: {
          host: 'localhost:8081',
        },
      }),
      response
    );
    await delayAsync(0);
    expect(response.statusCode).toBe(200);
  });

  it('handleRequestAsync should support plugin with scoped package name', async () => {
    const devToolsPluginManager = new MockDevToolsPluginManager('/');
    devToolsPluginManager.queryPluginAsync.mockImplementation(async (pluginName) =>
      pluginName === '@namespace/hello-plugin'
        ? {
            packageName: '@namespace/hello-plugin',
            packageRoot: '/root/node_modules/@namespace/hello-plugin',
            webpageRoot: '/root/node_modules/@namespace/hello-plugin/dist',
          }
        : null
    );
    vol.fromJSON({
      '/root/node_modules/@namespace/hello-plugin/dist/index.html': '<html></html>',
    });

    const middleware = createMiddleware(devToolsPluginManager);

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/plugins/@namespace/hello-plugin',
        headers: {
          host: 'localhost:8081',
        },
      }),
      response
    );
    await delayAsync(0);
    expect(response.statusCode).toBe(200);

    const response2 = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/plugins/hello-plugin',
        headers: {
          host: 'localhost:8081',
        },
      }),
      response2
    );
    await delayAsync(0);
    expect(response2.statusCode).toBe(404);
  });

  it('handleRequestAsync should return static resources from a matched plugin', async () => {
    const devToolsPluginManager = new MockDevToolsPluginManager('/');
    devToolsPluginManager.queryPluginAsync.mockResolvedValue({
      packageName: 'hello-plugin',
      packageRoot: '/root/packages/hello-plugin',
      webpageRoot: '/root/packages/hello-plugin/dist',
    });
    vol.fromJSON({
      '/root/packages/hello-plugin/dist/index.html': '<html></html>',
      '/root/packages/hello-plugin/dist/static/icon.png': 'PNGPNG',
    });

    const middleware = createMiddleware(devToolsPluginManager);
    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/plugins/hello-plugin/static/icon.png',
        headers: {
          host: 'localhost:8081',
        },
      }),
      response
    );
    await delayAsync(0);
    expect(response.statusCode).toBe(200);
    expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
  });

  it('handleRequestAsync should return 404 if plugin is not found', async () => {
    const middleware = createMiddleware();
    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/plugins/hello-plugin',
        headers: {
          host: 'localhost:8081',
        },
      }),
      response
    );
    await delayAsync(0);
    expect(response.statusCode).toBe(404);
  });

  it('handleRequestAsync should return 404 if plugin static resource is not found', async () => {
    const devToolsPluginManager = new MockDevToolsPluginManager('/');
    devToolsPluginManager.queryPluginAsync.mockResolvedValue({
      packageName: 'hello-plugin',
      packageRoot: '/root/packages/hello-plugin',
      webpageRoot: '/root/packages/hello-plugin/dist',
    });
    vol.fromJSON({
      '/root/packages/hello-plugin/dist/index.html': '<html></html>',
      '/root/packages/hello-plugin/dist/static/icon.png': 'PNGPNG',
    });

    const middleware = createMiddleware(devToolsPluginManager);
    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/plugins/hello-plugin/static/notfound.png',
        headers: {
          host: 'localhost:8081',
        },
      }),
      response
    );
    await delayAsync(0);
    expect(response.statusCode).toBe(404);
  });

  describe('serverEntryPoint', () => {
    function createPluginManager(plugin: object) {
      const devToolsPluginManager = new MockDevToolsPluginManager('/');
      devToolsPluginManager.queryPluginAsync.mockResolvedValue(plugin);
      return devToolsPluginManager;
    }

    it('should respond using the plugin request handler', async () => {
      const requestHandler = jest.fn(async (request: Request) => {
        const url = new URL(request.url);
        return new Response(JSON.stringify({ pathname: url.pathname, query: url.search }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      });
      const middleware = createMiddleware(
        createPluginManager({
          packageName: 'hello-plugin',
          packageRoot: '/root/packages/hello-plugin',
          serverEntryPoint: '/root/packages/hello-plugin/dist/server.js',
          getRequestHandlerAsync: async () => requestHandler,
        })
      );

      const response = createStreamingResponse();
      await middleware.handleRequestAsync(
        createServerRequest(
          'http://localhost:8081/_expo/plugins/hello-plugin/api/hello?name=world'
        ),
        response
      );

      expect(response.statusCode).toBe(200);
      // The plugin prefix is stripped so handlers see package-relative URLs.
      expect(JSON.parse(response.body())).toEqual({
        pathname: '/api/hello',
        query: '?name=world',
      });
      expect(requestHandler).toHaveBeenCalledTimes(1);
    });

    it('should fall back to static serving when the handler returns null', async () => {
      const requestHandler = jest.fn(async () => null);
      const middleware = createMiddleware(
        createPluginManager({
          packageName: 'hello-plugin',
          packageRoot: '/root/packages/hello-plugin',
          webpageRoot: '/root/packages/hello-plugin/dist',
          serverEntryPoint: '/root/packages/hello-plugin/dist/server.js',
          getRequestHandlerAsync: async () => requestHandler,
        })
      );
      vol.fromJSON({
        '/root/packages/hello-plugin/dist/index.html': '<html></html>',
      });

      const response = createMockResponse();
      await middleware.handleRequestAsync(
        createServerRequest('http://localhost:8081/_expo/plugins/hello-plugin'),
        response
      );
      await delayAsync(0);
      expect(requestHandler).toHaveBeenCalledTimes(1);
      expect(response.statusCode).toBe(200);
    });

    it('should return 404 when the handler returns null and no webpageRoot is set', async () => {
      const middleware = createMiddleware(
        createPluginManager({
          packageName: 'hello-plugin',
          packageRoot: '/root/packages/hello-plugin',
          serverEntryPoint: '/root/packages/hello-plugin/dist/server.js',
          getRequestHandlerAsync: async () => jest.fn(async () => null),
        })
      );

      const response = createStreamingResponse();
      await middleware.handleRequestAsync(
        createServerRequest('http://localhost:8081/_expo/plugins/hello-plugin/missing'),
        response
      );
      expect(response.statusCode).toBe(404);
    });

    it('should return 500 when the handler throws', async () => {
      const middleware = createMiddleware(
        createPluginManager({
          packageName: 'hello-plugin',
          packageRoot: '/root/packages/hello-plugin',
          serverEntryPoint: '/root/packages/hello-plugin/dist/server.js',
          getRequestHandlerAsync: async () =>
            jest.fn(async () => {
              throw new Error('boom');
            }),
        })
      );

      const response = createStreamingResponse();
      await middleware.handleRequestAsync(
        createServerRequest('http://localhost:8081/_expo/plugins/hello-plugin/api/hello'),
        response
      );
      expect(response.statusCode).toBe(500);
      expect(response.body()).toContain('boom');
    });

    it('should not write a 500 when the response has already started', async () => {
      const middleware = createMiddleware(
        createPluginManager({
          packageName: 'hello-plugin',
          packageRoot: '/root/packages/hello-plugin',
          serverEntryPoint: '/root/packages/hello-plugin/dist/server.js',
          getRequestHandlerAsync: async () =>
            jest.fn(async () => {
              throw new Error('stream aborted');
            }),
        })
      );

      const response = Object.assign(createMockResponse(), { headersSent: true });
      await middleware.handleRequestAsync(
        createServerRequest('http://localhost:8081/_expo/plugins/hello-plugin/api/hello'),
        response
      );

      expect(response.statusCode).toBe(200);
      expect(response.setHeader).not.toHaveBeenCalled();
      expect(response.end).not.toHaveBeenCalled();
    });
  });

  it('handleRequestAsync should throw from invalid request', async () => {
    const middleware = createMiddleware();
    const response = createMockResponse();
    expect(
      middleware.handleRequestAsync(
        asReq({
          url: 'http://localhost:8081/',
        }),
        response
      )
    ).rejects.toThrow();
  });
});
