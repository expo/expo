// `.native.ts` on purpose.
// The node project makes `marshal`'s DOM side a no-op, and jsdom has no
// `MessageChannel` for `react-dom/server`.
import type { BridgeMessage } from '../dom.types';

describe('notifyDOMReady', () => {
  const postMessage = vi.fn();
  const hasWebViewBridge = vi.fn();
  let hasGlobalWindow = false;

  beforeEach(() => {
    // `marshal` reads the environment at module scope, so set it up before requiring it.
    vi.resetModules();
    vi.doMock('../webview-bridge', () => ({
      hasWebViewBridge,
      getWebViewBridge: () => ({ postMessage, injectedObjectJson: () => '{}' }),
    }));
    hasGlobalWindow = typeof globalThis.window !== 'undefined';
    globalThis.window ??= {} as Window & typeof globalThis;
    globalThis.window.$$EXPO_INITIAL_PROPS = { names: [], props: {} };
  });

  afterEach(() => {
    delete globalThis.window.$$EXPO_INITIAL_PROPS;
    // The next suite renders in node and expects no `window`.
    if (!hasGlobalWindow) {
      delete (globalThis as any).window;
    }
  });

  it('should post a $$dom_ready message to the native side', async () => {
    hasWebViewBridge.mockReturnValue(true);
    const { notifyDOMReady } = await import('../marshal');

    notifyDOMReady();

    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: '$$dom_ready', data: null }));
  });

  it('should do nothing outside of a DOM component webview', async () => {
    hasWebViewBridge.mockReturnValue(false);
    const { notifyDOMReady } = await import('../marshal');

    notifyDOMReady();

    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe('$$dom_ready', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('../../utils/getDevServer', () => ({
      __esModule: true,
      default: () => ({ url: 'http://localhost:8081' }),
    }));
  });

  // `react-dom/server` is the only renderer here, so this mounts without effects.
  // Enough for these tests, since `onMessage` is wired up during render.
  async function renderRawWebView(props: Record<string, unknown>) {
    const injectJavaScript = vi.fn();
    let webViewProps: Record<string, any> = {};
    vi.doMock('@expo/dom-webview', () => ({
      WebView: (stubProps: any) => {
        webViewProps = stubProps;
        // `ref` arrives as a plain prop, and the wrapper injects scripts through it.
        stubProps.ref.current = { injectJavaScript };
        return null;
      },
    }));
    const React = await import('react');
    // @ts-ignore: `react-dom/server` ships no type declarations in this package.
    const { renderToStaticMarkup } = await import('react-dom/server');
    const RawWebView = (await import('../webview-wrapper')).default;

    renderToStaticMarkup(React.createElement(RawWebView, { filePath: 'index.tsx', ...props }));

    return { injectJavaScript, webViewProps };
  }

  function readInjectedEvent(script: string): BridgeMessage<any> {
    const [, payload] = script.match(/new CustomEvent\("\$\$dom_event",([\s\S]*)\)\);/) ?? [];
    if (payload == null) {
      throw new Error(`Expected a script injecting a DOM event, got: ${script}`);
    }
    return JSON.parse(payload).detail;
  }

  function domReadyEvent() {
    return { nativeEvent: { data: JSON.stringify({ type: '$$dom_ready', data: null }) } };
  }

  it('should be answered with the marshalled props', async () => {
    const { injectJavaScript, webViewProps } = await renderRawWebView({
      title: 'updated',
      onAction: () => {},
    });

    webViewProps.onMessage(domReadyEvent());

    expect(injectJavaScript).toHaveBeenCalledTimes(1);
    expect(readInjectedEvent(injectJavaScript.mock.calls[0]?.[0])).toEqual({
      type: '$$props',
      data: { names: ['onAction'], props: { title: 'updated' } },
    });
  });

  it('should be answered every time, since the webview can reload', async () => {
    const { injectJavaScript, webViewProps } = await renderRawWebView({ title: 'updated' });

    webViewProps.onMessage(domReadyEvent());
    webViewProps.onMessage(domReadyEvent());

    expect(injectJavaScript).toHaveBeenCalledTimes(2);
  });

  it('should not reach the `onMessage` handler of the component', async () => {
    const onMessage = vi.fn();
    const { webViewProps } = await renderRawWebView({ dom: { onMessage } });

    webViewProps.onMessage(domReadyEvent());

    expect(onMessage).not.toHaveBeenCalled();
  });
});
