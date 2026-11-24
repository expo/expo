import { getBundleOrigin } from '../getBundleOrigin';
import { getBundleUrl } from '../getBundleUrl';

jest.mock('../getBundleUrl', () => ({ getBundleUrl: jest.fn() }));

function mockBundleUrl(url: string | null) {
  jest.mocked(getBundleUrl).mockReturnValue(url);
}

describe(getBundleOrigin, () => {
  it(`returns the origin of a bundle served over HTTP`, () => {
    mockBundleUrl('http://127.0.0.1:8081/index.bundle?platform=ios&dev=true');
    expect(getBundleOrigin()).toBe('http://127.0.0.1:8081');
  });

  it(`keeps the scheme of a bundle served over HTTPS`, () => {
    mockBundleUrl('https://proxy.test/index.bundle?platform=ios');
    expect(getBundleOrigin()).toBe('https://proxy.test');
  });

  it(`returns null for a bundle loaded from disk`, () => {
    mockBundleUrl('file:///var/containers/app/main.jsbundle');
    expect(getBundleOrigin()).toBeNull();
  });

  it(`returns null when the bundle URL is unknown`, () => {
    mockBundleUrl(null);
    expect(getBundleOrigin()).toBeNull();
  });

  it(`returns null for an unparseable bundle URL`, () => {
    mockBundleUrl('not a url');
    expect(getBundleOrigin()).toBeNull();
  });
});
