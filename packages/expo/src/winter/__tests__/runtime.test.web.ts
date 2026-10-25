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
  // The jsdom environment provides animation frames, which a server environment such as Node.js
  // does not, so remove them for each test.
  const jsdomRequestAnimationFrame = globalThis.requestAnimationFrame;
  const jsdomCancelAnimationFrame = globalThis.cancelAnimationFrame;

  beforeEach(() => {
    // @ts-expect-error Simulates a server environment without animation frames.
    delete globalThis.requestAnimationFrame;
    // @ts-expect-error Simulates a server environment without animation frames.
    delete globalThis.cancelAnimationFrame;
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = jsdomRequestAnimationFrame;
    globalThis.cancelAnimationFrame = jsdomCancelAnimationFrame;
    jest.resetModules();
  });

  it('stubs requestAnimationFrame on the server, never running callbacks', async () => {
    require('../runtime');

    const callback = jest.fn();
    globalThis.requestAnimationFrame(callback);
    globalThis.cancelAnimationFrame(0);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps an existing requestAnimationFrame on the server', () => {
    const existingRequestAnimationFrame = jest.fn();
    globalThis.requestAnimationFrame = existingRequestAnimationFrame;
    require('../runtime');

    expect(globalThis.requestAnimationFrame).toBe(existingRequestAnimationFrame);
  });
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
