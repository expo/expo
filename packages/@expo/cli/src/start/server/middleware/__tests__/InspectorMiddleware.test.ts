import { isInspectorRequest, isWebRequest, withoutInspectorRequests } from '../InspectorMiddleware';
import { ServerRequest } from '../server.types';

const asRequest = (req: Partial<ServerRequest>) => req as ServerRequest;

describe(isInspectorRequest, () => {
  it('returns true for no UA + known inspector endpoint', () => {
    const request = asRequest({
      url: '/inspector/debug',
      headers: {},
    });

    expect(isInspectorRequest(request)).toBe(true);
  });

  it('returns true for node-fetch user-agent + known inspector endpoint', () => {
    const request = asRequest({
      url: '/json/list',
      headers: {
        'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
      },
    });

    expect(isInspectorRequest(request)).toBe(true);
  });

  it('returns false for browser user-agent + known inspector endpoint', () => {
    const request = asRequest({
      url: '/json/list',
      headers: {
        'user-agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
      },
    });

    expect(isInspectorRequest(request)).toBe(false);
  });
});

describe(isWebRequest, () => {
  it('returns false for android platform request', () => {
    const request = asRequest({
      url: '/some/page',
      headers: {
        'expo-platform': 'android',
      },
    });

    expect(isWebRequest(request)).toBe(false);
  });

  it('returns false for ios platform request', () => {
    const request = asRequest({
      url: '/some/page',
      headers: {
        'expo-platform': 'ios',
      },
    });

    expect(isWebRequest(request)).toBe(false);
  });

  it('returns true for web platform request', () => {
    const request = asRequest({
      url: '/some/page',
      headers: {
        'expo-platform': 'web',
      },
    });

    expect(isWebRequest(request)).toBe(true);
  });

  it('returns true when platform is not specified', () => {
    const request = asRequest({
      url: '/some/page',
      headers: {},
    });

    expect(isWebRequest(request)).toBe(true);
  });
});

describe(withoutInspectorRequests, () => {
  it('disables middleware for inspector requests', () => {
    const middleware = jest.fn();
    const next = jest.fn();

    const handler = withoutInspectorRequests(middleware);
    const request = asRequest({
      url: '/json/list',
      headers: {
        'user-agent': 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)',
      },
    });

    handler(request, {} as any, next);

    expect(middleware).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
  });

  it('enables middleware for non-inspector requests', () => {
    const middleware = jest.fn();
    const next = jest.fn();

    const handler = withoutInspectorRequests(middleware);
    const request = asRequest({
      url: '/some/page',
      headers: {},
    });

    handler(request, {} as any, next);

    expect(middleware).toBeCalledTimes(1);
    expect(next).toBeCalledTimes(0);
  });
});
