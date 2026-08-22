import { CommandError } from '../../utils/errors';
import { createLaunchAsync, launchEndpoint } from '../launchUpload';

const realFetch = global.fetch;
const realHost = process.env.LAUNCH_HOST;

/** A gzipped tarball stands in as an opaque body: nothing here reads it. */
const body = () => new ReadableStream<Uint8Array>({ start: (controller) => controller.close() });

const auth = { type: 'session', value: 'session-secret' } as const;

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, ...response });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

/** The headers of the one request that was made. */
function requestHeaders(fetchMock: jest.Mock): Headers {
  return fetchMock.mock.calls[0][1].headers as Headers;
}

beforeEach(() => {
  delete process.env.LAUNCH_HOST;
});

afterEach(() => {
  global.fetch = realFetch;
  if (realHost == null) {
    delete process.env.LAUNCH_HOST;
  } else {
    process.env.LAUNCH_HOST = realHost;
  }
});

describe(launchEndpoint, () => {
  it(`should post to the Launch service`, () => {
    expect(launchEndpoint()).toBe('https://launch.expo.dev/--/v1/launch/cli');
  });

  it(`should accept another host, over https`, () => {
    process.env.LAUNCH_HOST = 'staging.launch.expo.dev';

    expect(launchEndpoint()).toBe('https://staging.launch.expo.dev/--/v1/launch/cli');
  });

  it(`should keep the scheme when the host carries one`, () => {
    // This is how the e2e suite points the upload at a local server instead of the service.
    process.env.LAUNCH_HOST = 'http://127.0.0.1:1234';

    expect(launchEndpoint()).toBe('http://127.0.0.1:1234/--/v1/launch/cli');
  });
});

describe(createLaunchAsync, () => {
  const launch = { id: 'launch-1', url: 'https://launch.expo.dev/l/abc', framework: 'expo' };

  it(`should stream the tarball to the service and return the launch`, async () => {
    const fetchMock = mockFetch({ json: async () => launch });

    await expect(createLaunchAsync({ auth, body: body() })).resolves.toEqual(launch);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://launch.expo.dev/--/v1/launch/cli');
    expect(init.method).toBe('POST');
    // A streamed body needs a half duplex request, or the upload is buffered in memory.
    expect(init.duplex).toBe('half');
    expect(requestHeaders(fetchMock).get('content-type')).toBe('application/gzip');
    expect(requestHeaders(fetchMock).get('accept')).toBe('application/json');
    expect(requestHeaders(fetchMock).get('user-agent')).toMatch(/^exagent\//);
  });

  it(`should send a session as the Expo-Session header`, async () => {
    const fetchMock = mockFetch({ json: async () => launch });

    await createLaunchAsync({ auth, body: body() });

    expect(requestHeaders(fetchMock).get('expo-session')).toBe('session-secret');
    expect(requestHeaders(fetchMock).get('authorization')).toBeNull();
  });

  it(`should send a token as a bearer authorization`, async () => {
    const fetchMock = mockFetch({ json: async () => launch });

    await createLaunchAsync({ auth: { type: 'token', value: 'token-value' }, body: body() });

    expect(requestHeaders(fetchMock).get('authorization')).toBe('Bearer token-value');
    expect(requestHeaders(fetchMock).get('expo-session')).toBeNull();
  });

  it(`should name the app inside the tarball for a monorepo upload`, async () => {
    const fetchMock = mockFetch({ json: async () => launch });

    await createLaunchAsync({ auth, body: body(), projectRoot: 'apps/mobile' });

    expect(requestHeaders(fetchMock).get('x-project-root')).toBe('apps/mobile');
  });

  it(`should leave out the project root of a single app upload`, async () => {
    const fetchMock = mockFetch({ json: async () => launch });

    await createLaunchAsync({ auth, body: body() });

    expect(requestHeaders(fetchMock).get('x-project-root')).toBeNull();
  });

  it(`should report the message the service returned`, async () => {
    mockFetch({ ok: false, status: 400, json: async () => ({ message: 'Unsupported framework' }) });

    await expect(createLaunchAsync({ auth, body: body() })).rejects.toMatchObject({
      code: 'LAUNCH_API',
      message: expect.stringContaining('Unsupported framework'),
    });
  });

  it(`should report a response with no message at all`, async () => {
    mockFetch({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(createLaunchAsync({ auth, body: body() })).rejects.toMatchObject({
      code: 'LAUNCH_API',
      message: expect.stringContaining('500'),
    });
  });

  it(`should answer a rejected session with the login command`, async () => {
    // A session secret on disk can be revoked or expired, and then this is the only way out.
    mockFetch({ ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) });

    expect.assertions(3);
    try {
      await createLaunchAsync({ auth, body: body() });
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('LAUNCH_NOT_AUTHENTICATED');
      expect(error.suggestedCommand).toBe('npx expo login');
    }
  });

  it(`should report an unreachable service instead of an unhandled rejection`, async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(createLaunchAsync({ auth, body: body() })).rejects.toMatchObject({
      code: 'LAUNCH_UNREACHABLE',
      message: expect.stringContaining('ENOTFOUND'),
    });
  });
});
