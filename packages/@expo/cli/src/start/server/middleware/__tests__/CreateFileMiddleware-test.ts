import { vol } from 'memfs';

import { CreateFileMiddleware } from '../CreateFileMiddleware';
import { ServerRequest, ServerResponse } from '../server.types';

const asReq = (req: Partial<ServerRequest>) => req as ServerRequest;

afterEach(() => {
  vol.reset();
});

function createMiddleware() {
  vol.fromJSON({}, '/');

  const middleware = new CreateFileMiddleware({
    metroRoot: '/',
    projectRoot: '/',
    appDir: '/app',
  });
  middleware['parseRawBody'] = jest.fn((req) => JSON.parse((req as any).body));
  return { middleware };
}

function createMockResponse() {
  return {
    setHeader: jest.fn(),
    end: jest.fn(),
    statusCode: 200,
  } as unknown as ServerResponse;
}

describe('shouldHandleRequest', () => {
  const { middleware } = createMiddleware();

  it(`returns false when the middleware should not handle`, () => {
    for (const req of [
      asReq({}),
      asReq({ url: 'http://localhost:8081' }),
      asReq({ url: 'http://localhost:8081/' }),
    ]) {
      expect(middleware.shouldHandleRequest(req)).toBe(false);
    }
  });
  it(`returns true when the middleware should handle`, () => {
    for (const req of [asReq({ url: 'http://localhost:8081/_expo/touch' })]) {
      expect(middleware.shouldHandleRequest(req)).toBe(true);
    }
  });
});

describe('handleRequestAsync', () => {
  it('refuses non-POST', async () => {
    const { middleware } = createMiddleware();

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/touch',
      }),
      response
    );
    expect(response.statusCode).toBe(405);
    expect(response.end).toBeCalledWith('Method Not Allowed');
  });
  it('creates a "router_index" file', async () => {
    const { middleware } = createMiddleware();

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/touch',
        method: 'POST',
        body: JSON.stringify({ type: 'router_index' }),
      }),
      response
    );
    expect(response.statusCode).toBe(200);
    expect(response.end).toBeCalledWith('OK');
    expect(vol.readFileSync('/app/index.js', 'utf8')).toMatch(/import/);
  });
  it('creates a "router_index" TypeScript file when added to a project with a tsconfig', async () => {
    vol.writeFileSync('/tsconfig.json', JSON.stringify({ compilerOptions: {} }));

    const { middleware } = createMiddleware();

    const response = createMockResponse();
    await middleware.handleRequestAsync(
      asReq({
        url: 'http://localhost:8081/_expo/touch',
        method: 'POST',
        body: JSON.stringify({ type: 'router_index' }),
      }),
      response
    );
    expect(response.statusCode).toBe(200);
    expect(response.end).toBeCalledWith('OK');
    expect(vol.readFileSync('/app/index.tsx', 'utf8')).toMatch(/import/);
  });
});
