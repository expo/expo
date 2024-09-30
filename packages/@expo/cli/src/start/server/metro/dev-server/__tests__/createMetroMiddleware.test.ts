import { withMetroServer } from './utils';
import { openInEditorAsync } from '../../../../../utils/editor';
import { createMetroMiddleware } from '../createMetroMiddleware';

jest.mock('../../../../../utils/editor');

describe(createMetroMiddleware, () => {
  const { metro, server, projectRoot } = withMetroServer();

  it('disables cache on all requests', async () => {
    // Register an endpoint to capture the response headers
    metro.middleware.use('/thisisatest', (_req, res) => res.end('OK'));

    const response = await server.fetch('/thisisatest');

    // Ensure the request is successful
    expect(response.status).toBe(200);
    // Ensure the cache control headers are set
    expect(response.headers.get('Surrogate-Control')).toBe('no-store');
    expect(response.headers.get('Cache-Control')).toBe(
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
  });

  it('responds to /status requests', async () => {
    const response = await server.fetch('/status');

    // Ensure the request is successful
    expect(response.status).toBe(200);
    // Ensure the React Native project root header is set
    expect(response.headers.get('X-React-Native-Project-Root')).toBe(projectRoot);
    // Ensure the response body has the packager status
    await expect(response.text()).resolves.toBe('packager-status:running');
  });

  it('responds to /open-stack-frame requests', async () => {
    // Avoid opening the fake file
    jest.mocked(openInEditorAsync).mockResolvedValue(true);

    const response = await server.fetch('/open-stack-frame', {
      method: 'POST',
      body: JSON.stringify({ file: 'test-file.ts', lineNumber: 1337 }),
    });

    // Ensure the request is successful
    expect(response.status).toBe(200);
    // Ensure the open in editor was called
    expect(openInEditorAsync).toHaveBeenCalledWith('test-file.ts', 1337);
  });

  it('prepares /symbolicate requests with raw body', async () => {
    // Create a fake middleware to capture the request and respond with OK
    const middleware = jest.fn((_req, res) => res.end('OK'));
    // Create a fake symbolicate request body
    const body = JSON.stringify({
      stack: [
        {
          file: 'test-file.ts',
          methodName: 'testMethod',
          arguments: [],
          lineNumber: 1337,
          column: 0,
        },
      ],
    });

    // Register the middleware to capture the request
    metro.middleware.use('/symbolicate', middleware);

    const response = await server.fetch('/symbolicate', { method: 'POST', body });

    // Ensure the request is successful
    expect(response.status).toBe(200);
    // Ensure the request body was loaded as `rawBody` string
    expect(middleware.mock.calls[0][0]).toHaveProperty('rawBody', body);
  });

  describe('websockets', () => {
    it('creates the /message websocket', () => {
      expect(metro.messagesSocket).toBeDefined();
      expect(metro.messagesSocket).toHaveProperty('endpoint', '/message');
      expect(metro.messagesSocket).toHaveProperty('broadcast', expect.any(Function));
      expect(metro.websocketEndpoints).toHaveProperty(
        metro.messagesSocket.endpoint,
        metro.messagesSocket.server
      );
    });

    it('creates the /events websocket', () => {
      expect(metro.eventsSocket).toBeDefined();
      expect(metro.eventsSocket).toHaveProperty('endpoint', '/events');
      expect(metro.eventsSocket).toHaveProperty('reportMetroEvent', expect.any(Function));
      expect(metro.websocketEndpoints).toHaveProperty(
        metro.eventsSocket.endpoint,
        metro.eventsSocket.server
      );
    });
  });
});
