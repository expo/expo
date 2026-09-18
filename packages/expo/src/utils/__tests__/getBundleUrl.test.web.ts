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
    vi.resetModules();
  });

  it('returns the bundle URL while the script is executing synchronously', async () => {
    setCurrentScript('https://localhost:8081/index.bundle?platform=web');
    const { getBundleUrl } = await import('../getBundleUrl');
    expect(getBundleUrl()).toBe('https://localhost:8081/index.bundle');
  });

  it('still returns the bundle URL after the script finished executing', async () => {
    setCurrentScript('https://localhost:8081/index.bundle?platform=web');
    const { getBundleUrl } = await import('../getBundleUrl');
    setCurrentScript(null);
    expect(getBundleUrl()).toBe('https://localhost:8081/index.bundle');
  });
}
