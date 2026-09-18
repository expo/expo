describe('resolveWebView', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should resolve @expo/dom-webview when useExpoDOMWebView is true', async () => {
    vi.doMock('@expo/dom-webview', () => ({ WebView: 'StubExpoDOMWebView' }));
    const { resolveWebView } = await import('../webview-wrapper');
    const webView = resolveWebView(true);
    expect(webView).toBe('StubExpoDOMWebView');
  });

  it('should resolve react-native-webview when useExpoDOMWebView is false', async () => {
    vi.doMock('react-native-webview', () => ({ WebView: 'StubRNWebView' }));
    const { resolveWebView } = await import('../webview-wrapper');
    const webView = resolveWebView(false);
    expect(webView).toBe('StubRNWebView');
  });

  it('should throw an error if @expo/dom-webview cannot be resolved when useExpoDOMWebView is true', async () => {
    vi.doMock('@expo/dom-webview', () => {
      throw new Error("Cannot find module '@expo/dom-webview'");
    });
    const { resolveWebView } = await import('../webview-wrapper');
    expect(() => resolveWebView(true)).toThrow(
      "Unable to resolve the '@expo/dom-webview' module. Make sure to install it with 'npx expo install @expo/dom-webview'."
    );
  });

  it('should throw an error if react-native-webview cannot be resolved when useExpoDOMWebView is false', async () => {
    vi.doMock('react-native-webview', () => {
      throw new Error("Cannot find module 'react-native-webview'");
    });
    const { resolveWebView } = await import('../webview-wrapper');
    expect(() => resolveWebView(false)).toThrow(
      "Unable to resolve the 'react-native-webview' module. Make sure to install it with 'npx expo install react-native-webview'."
    );
  });
});
