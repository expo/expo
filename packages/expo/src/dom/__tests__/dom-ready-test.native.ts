// Both ends of the `$$dom_ready` handshake: the DOM component asks for its
// props once it is listening for them, and the native wrapper answers with the
// props of the current render.
//
// This file is scoped to the native jest projects because the other two cannot
// run it: the node project compiles `typeof window` down to `undefined` for
// server bundles, which turns the DOM side of `marshal` into a no-op, and the
// browser build of `react-dom/server` needs `MessageChannel`, which the jsdom
// project does not provide. DOM components only run on native, so the code
// under test is the same either way.
import type { BridgeMessage } from '../dom.types';

describe('notifyDOMReady', () => {
  const postMessage = jest.fn();
  const hasWebViewBridge = jest.fn();

  beforeEach(() => {
    // `marshal` decides whether it runs inside a DOM component when the module
    // is evaluated, so the environment has to be set up before requiring it.
    jest.resetModules();
    jest.doMock('../webview-bridge', () => ({
      hasWebViewBridge,
      getWebViewBridge: () => ({ postMessage, injectedObjectJson: () => '{}' }),
    }));
    globalThis.window ??= {} as Window & typeof globalThis;
    globalThis.window.$$EXPO_INITIAL_PROPS = { names: [], props: {} };
  });

  afterEach(() => {
    delete globalThis.window.$$EXPO_INITIAL_PROPS;
  });

  it('should post a $$dom_ready message to the native side', () => {
    hasWebViewBridge.mockReturnValue(true);
    const { notifyDOMReady } = require('../marshal');

    notifyDOMReady();

    expect(postMessage).toHaveBeenCalledWith(JSON.stringify({ type: '$$dom_ready', data: null }));
  });

  it('should do nothing outside of a DOM component webview', () => {
    hasWebViewBridge.mockReturnValue(false);
    const { notifyDOMReady } = require('../marshal');

    notifyDOMReady();

    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe('$$dom_ready', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../utils/getDevServer', () => ({
      __esModule: true,
      default: () => ({ url: 'http://localhost:8081' }),
    }));
  });

  /**
   * Renders `RawWebView` with a stub webview so a test can drive `onMessage`
   * and read back what the wrapper injects into the webview. `react-dom/server`
   * is the only renderer this package depends on, so the render is a mount
   * without effects — enough for `onMessage`, which is set up during render.
   */
  function renderRawWebView(props: Record<string, unknown>) {
    const injectJavaScript = jest.fn();
    let webViewProps: Record<string, any> = {};
    jest.doMock('@expo/dom-webview', () => ({
      WebView: (stubProps: any) => {
        webViewProps = stubProps;
        // React hands `ref` to function components as a regular prop, and the
        // wrapper injects scripts through it.
        stubProps.ref.current = { injectJavaScript };
        return null;
      },
    }));
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const RawWebView = require('../webview-wrapper').default;

    renderToStaticMarkup(React.createElement(RawWebView, { filePath: 'index.tsx', ...props }));

    return { injectJavaScript, webViewProps };
  }

  /** Reads the `$$dom_event` payload back out of an injected script. */
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

  it('should be answered with the marshalled props', () => {
    const { injectJavaScript, webViewProps } = renderRawWebView({
      title: 'updated',
      onAction: () => {},
    });

    webViewProps.onMessage(domReadyEvent());

    expect(injectJavaScript).toHaveBeenCalledTimes(1);
    expect(readInjectedEvent(injectJavaScript.mock.calls[0][0])).toEqual({
      type: '$$props',
      data: { names: ['onAction'], props: { title: 'updated' } },
    });
  });

  it('should be answered every time, since the webview can reload', () => {
    const { injectJavaScript, webViewProps } = renderRawWebView({ title: 'updated' });

    webViewProps.onMessage(domReadyEvent());
    webViewProps.onMessage(domReadyEvent());

    expect(injectJavaScript).toHaveBeenCalledTimes(2);
  });

  it('should not reach the `onMessage` handler of the component', () => {
    const onMessage = jest.fn();
    const { webViewProps } = renderRawWebView({ dom: { onMessage } });

    webViewProps.onMessage(domReadyEvent());

    expect(onMessage).not.toHaveBeenCalled();
  });
});
