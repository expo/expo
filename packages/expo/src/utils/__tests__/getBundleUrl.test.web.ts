/**
 * @jest-environment jsdom
 */

function setCurrentScript(src: string | null) {
  Object.defineProperty(document, 'currentScript', {
    configurable: true,
    value: src == null ? null : Object.assign(document.createElement('script'), { src }),
  });
}

// The web test project runs this file in jsdom, the node project on the server.
// `getBundleUrl` reads `document.currentScript`, so only assert in the browser.
if (typeof window === 'undefined') {
  it('noop', () => {});
} else {
  afterEach(() => {
    setCurrentScript(null);
    jest.resetModules();
  });

  it('returns the bundle URL while the script is executing synchronously', () => {
    setCurrentScript('https://localhost:8081/index.bundle?platform=web');
    const { getBundleUrl } = require('../getBundleUrl');
    expect(getBundleUrl()).toBe('https://localhost:8081/index.bundle');
  });

  it('still returns the bundle URL after the script finished executing', () => {
    setCurrentScript('https://localhost:8081/index.bundle?platform=web');
    const { getBundleUrl } = require('../getBundleUrl');
    setCurrentScript(null);
    expect(getBundleUrl()).toBe('https://localhost:8081/index.bundle');
  });
}
