import { getBundleUrl } from '../getBundleUrl';
import getDevServer from '../getDevServer';

jest.mock('../getBundleUrl', () => ({ getBundleUrl: jest.fn() }));

function mockBundleUrl(url: string | null) {
  jest.mocked(getBundleUrl).mockReturnValue(url);
}

describe('getDevServer', () => {
  it(`reports the server the bundle was loaded from`, () => {
    mockBundleUrl('http://proxy.test:4443/index.bundle?platform=ios&dev=true');
    expect(getDevServer()).toEqual({
      bundleLoadedFromServer: true,
      fullBundleUrl: 'http://proxy.test:4443/index.bundle?platform=ios&dev=true',
      url: 'http://proxy.test:4443/',
    });
  });

  it(`keeps an HTTPS server's scheme`, () => {
    mockBundleUrl('https://proxy.test/index.bundle');
    expect(getDevServer()).toMatchObject({
      bundleLoadedFromServer: true,
      url: 'https://proxy.test/',
    });
  });

  it(`falls back to a localhost address for a bundle loaded from disk`, () => {
    // Matches React Native's behaviour: consumers that need an address still get one, and
    // `bundleLoadedFromServer` tells them it's a guess.
    mockBundleUrl('file:///var/containers/app/main.jsbundle');
    expect(getDevServer()).toEqual({
      bundleLoadedFromServer: false,
      fullBundleUrl: null,
      url: 'http://localhost:8081/',
    });
  });

  it(`falls back when the bundle URL is unknown`, () => {
    mockBundleUrl(null);
    expect(getDevServer()).toMatchObject({
      bundleLoadedFromServer: false,
      url: 'http://localhost:8081/',
    });
  });
});
