/**
 * @jest-environment jsdom
 */

// `ImportMetaRegistry` also imports `getBundleUrl`, and Jest always loads imports eagerly. Mock it
// away so this test only measures whether `runtime` itself loads `getBundleUrl` eagerly. That is the
// property `transform.inlineRequires` removes in a real web bundle.
jest.mock('../ImportMetaRegistry', () => ({ ImportMetaRegistry: { url: null } }));
jest.mock('../../async-require/setup', () => ({}));

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

  it('captures the bundle URL while the entry script is still executing', () => {
    setCurrentScript('https://localhost:8081/index.bundle?platform=web');
    require('../runtime');
    setCurrentScript(null);

    const { getBundleUrl } = require('../../utils/getBundleUrl');
    expect(getBundleUrl()).toBe('https://localhost:8081/index.bundle');
  });
}
