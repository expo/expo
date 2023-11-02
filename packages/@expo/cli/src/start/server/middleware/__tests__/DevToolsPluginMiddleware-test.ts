import { vol } from 'memfs';

import DevToolsPluginManager from '../../DevToolsPluginManager';
import { DevToolsPluginMiddleware } from '../DevToolsPluginMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

jest.mock('fs/promises');

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

class MockDevToolsPluginManager extends DevToolsPluginManager {
  queryPluginsAsync = jest.fn().mockResolvedValue([]);
  queryPluginWebpageRootAsync = jest.fn().mockResolvedValue(null);
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

describe(DevToolsPluginMiddleware, () => {
  it('handleRequestAsync should return index.html from a matched plugin', async () => {
    const devToolsPluginManager = new MockDevToolsPluginManager('/');
    devToolsPluginManager.queryPluginsAsync.mockResolvedValue([
      {
        packageName: 'hello-plugin',
        packageRoot: '/root/packages/hello-plugin',
        webpageRoot: '/root/packages/hello-plugin/dist',
      },
    ]);
    devToolsPluginManager.queryPluginWebpageRootAsync.mockResolvedValue(
      '/root/packages/hello-plugin/dist'
    );
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
    devToolsPluginManager.queryPluginsAsync.mockResolvedValue([
      {
        packageName: '@namespace/hello-plugin',
        packageRoot: '/root/node_modules/@namespace/hello-plugin',
        webpageRoot: '/root/node_modules/@namespace/hello-plugin/dist',
      },
    ]);
    devToolsPluginManager.queryPluginWebpageRootAsync.mockResolvedValueOnce(
      '/root/node_modules/@namespace/hello-plugin/dist'
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
    devToolsPluginManager.queryPluginsAsync.mockResolvedValue([
      {
        packageName: 'hello-plugin',
        packageRoot: '/root/packages/hello-plugin',
        webpageRoot: '/root/packages/hello-plugin/dist',
      },
    ]);
    devToolsPluginManager.queryPluginWebpageRootAsync.mockResolvedValue(
      '/root/packages/hello-plugin/dist'
    );
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
    expect(response.setHeader).toBeCalledWith('Content-Type', 'image/png');
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
    devToolsPluginManager.queryPluginsAsync.mockResolvedValue([
      {
        packageName: 'hello-plugin',
        packageRoot: '/root/packages/hello-plugin',
        webpageRoot: '/root/packages/hello-plugin/dist',
      },
    ]);
    devToolsPluginManager.queryPluginWebpageRootAsync.mockResolvedValue(
      '/root/packages/hello-plugin/dist'
    );
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
