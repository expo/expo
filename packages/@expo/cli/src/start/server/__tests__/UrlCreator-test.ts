import * as Log from '../../../log';
import { UrlCreator } from '../UrlCreator';

jest.mock('../../../log');

beforeEach(() => {
  delete process.env.EXPO_PACKAGER_PROXY_URL;
  delete process.env.REACT_NATIVE_PACKAGER_HOSTNAME;
});

function createDefaultCreator() {
  return new UrlCreator({}, { port: 8081, getTunnelUrl: () => `http://tunnel.dev/` });
}

describe('constructLoadingUrl', () => {
  it(`creates default`, () => {
    expect(createDefaultCreator().constructLoadingUrl({}, 'ios')).toMatchInlineSnapshot(
      `"http://100.100.1.100:8081/_expo/loading?platform=ios"`
    );
    expect(createDefaultCreator().constructLoadingUrl({}, 'android')).toMatchInlineSnapshot(
      `"http://100.100.1.100:8081/_expo/loading?platform=android"`
    );
  });
  it(`creates tunnel`, () => {
    expect(
      createDefaultCreator().constructLoadingUrl({ hostType: 'tunnel' }, 'ios')
    ).toMatchInlineSnapshot(`"http://tunnel.dev/_expo/loading?platform=ios"`);
  });
  it(`allows any scheme`, () => {
    expect(
      createDefaultCreator().constructLoadingUrl({ scheme: 'my-scheme' }, 'android')
    ).toMatchInlineSnapshot(`"my-scheme://100.100.1.100:8081/_expo/loading?platform=android"`);
  });
  it(`allows null platform`, () => {
    expect(createDefaultCreator().constructLoadingUrl({}, null)).toMatchInlineSnapshot(
      `"http://100.100.1.100:8081/_expo/loading"`
    );
  });
});

describe('constructDevClientUrl', () => {
  it(`returns null when no custom scheme can be resolved`, () => {
    expect(createDefaultCreator().constructDevClientUrl({})).toEqual(null);
  });
  it(`returns null when the custom scheme is restricted`, () => {
    expect(createDefaultCreator().constructDevClientUrl({ scheme: 'http' })).toEqual(null);
    expect(createDefaultCreator().constructDevClientUrl({ scheme: 'https' })).toEqual(null);
  });
  it(`returns null when protocol contains "_" characters`, () => {
    expect(
      createDefaultCreator().constructDevClientUrl({ scheme: 'dev.expo.invalid_node_protocol' })
    ).toEqual(null);
  });
  it(`creates default`, () => {
    expect(createDefaultCreator().constructDevClientUrl({ scheme: 'bacon' })).toMatchInlineSnapshot(
      `"bacon://expo-development-client/?url=http%3A%2F%2F100.100.1.100%3A8081"`
    );
  });
  it(`creates tunnel`, () => {
    expect(
      createDefaultCreator().constructDevClientUrl({ scheme: 'bacon', hostType: 'tunnel' })
    ).toMatchInlineSnapshot(`"bacon://expo-development-client/?url=http%3A%2F%2Ftunnel.dev"`);
  });
  it(`creates localhost`, () => {
    expect(
      createDefaultCreator().constructDevClientUrl({ scheme: 'bacon', hostType: 'localhost' })
    ).toMatchInlineSnapshot(`"bacon://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"`);
  });
  it(`uses custom hostname`, () => {
    expect(
      createDefaultCreator().constructDevClientUrl({ scheme: 'bacon', hostname: 'foobar.dev' })
    ).toMatchInlineSnapshot(
      `"bacon://expo-development-client/?url=http%3A%2F%2Ffoobar.dev%3A8081"`
    );
  });
});

describe('constructUrl', () => {
  it(`skips default port with environment variable`, () => {
    process.env.EXPO_PACKAGER_PROXY_URL = 'http://expo.dev';
    expect(createDefaultCreator().constructUrl({})).toMatchInlineSnapshot(`"http://expo.dev"`);
  });

  it(`creates default`, () => {
    expect(createDefaultCreator().constructUrl({})).toMatchInlineSnapshot(
      `"http://100.100.1.100:8081"`
    );
  });
  it(`uses custom scheme`, () => {
    expect(createDefaultCreator().constructUrl({ scheme: 'exp' })).toMatchInlineSnapshot(
      `"exp://100.100.1.100:8081"`
    );
  });
  it(`uses localhost`, () => {
    expect(createDefaultCreator().constructUrl({ hostType: 'localhost' })).toMatchInlineSnapshot(
      `"http://127.0.0.1:8081"`
    );
  });
  it(`uses lan`, () => {
    expect(createDefaultCreator().constructUrl({ hostType: 'lan' })).toMatchInlineSnapshot(
      `"http://100.100.1.100:8081"`
    );
  });
  it(`uses tunnel`, () => {
    expect(createDefaultCreator().constructUrl({ hostType: 'tunnel' })).toMatchInlineSnapshot(
      `"http://tunnel.dev"`
    );
  });
  it(`uses defaults`, () => {
    expect(
      new UrlCreator({ scheme: 'foobar' }, { port: 8081 }).constructUrl({})
    ).toMatchInlineSnapshot(`"foobar://100.100.1.100:8081"`);
  });
  it(`uses function options over defaults`, () => {
    expect(
      new UrlCreator({ scheme: 'foobar' }, { port: 8081 }).constructUrl({ scheme: 'newer' })
    ).toMatchInlineSnapshot(`"newer://100.100.1.100:8081"`);
  });
  it(`warns when tunnel isn't available`, () => {
    jest.mocked(Log.warn).mockClear();
    expect(
      new UrlCreator({}, { port: 8081, getTunnelUrl: () => null }).constructUrl({
        hostType: 'tunnel',
      })
    ).toMatchInlineSnapshot(`"http://100.100.1.100:8081"`);
    expect(Log.warn).toHaveBeenCalledTimes(1);
    expect(Log.warn).toHaveBeenCalledWith(expect.stringMatching(/Tunnel/));
  });
  it(`changes hostname 'localhost' to '127.0.0.1'`, () => {
    expect(createDefaultCreator().constructUrl({ hostname: 'localhost' })).toMatchInlineSnapshot(
      `"http://127.0.0.1:8081"`
    );
  });
  it(`uses a custom hostname`, () => {
    expect(createDefaultCreator().constructUrl({ hostname: 'foobar.dev' })).toMatchInlineSnapshot(
      `"http://foobar.dev:8081"`
    );
  });
  it(`uses env variable as proxy`, () => {
    process.env.EXPO_PACKAGER_PROXY_URL = 'http://localhost:9999';
    expect(
      createDefaultCreator().constructUrl({
        // scheme will be used, all others will be ignored...
        scheme: 'foobar',
        hostType: 'tunnel',
        hostname: 'foobar.dev',
      })
    ).toMatchInlineSnapshot(`"foobar://localhost:9999"`);
  });
});
