// `.web.ts` on purpose: mounting the wrapper for real (so its effects run) needs
// `react-dom/client`, and the Web project is the only one with a DOM. The Node
// project picks `.web` tests up as well, hence the guard below.
import type { BridgeMessage } from '../dom.types';

const describeWithDOM = typeof document !== 'undefined' ? describe : describe.skip;

describeWithDOM('$$props emit', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../utils/getDevServer', () => ({
      __esModule: true,
      default: () => ({ url: 'http://localhost:8081' }),
    }));
  });

  function mountRawWebView() {
    // Mimics `@expo/dom-webview`, where `injectJavaScript` is a view `AsyncFunction`
    // that rejects while the native view cannot be resolved by tag yet.
    const injectJavaScript = jest.fn().mockImplementation(() => Promise.resolve());
    let webViewProps: Record<string, any> = {};
    jest.doMock('@expo/dom-webview', () => ({
      WebView: (stubProps: any) => {
        webViewProps = stubProps;
        // `ref` arrives as a plain prop, and the wrapper injects scripts through it.
        stubProps.ref.current = { injectJavaScript };
        return null;
      },
    }));
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const React = require('react');
    const { act } = React;
    const { createRoot } = require('react-dom/client');
    const RawWebView = require('../webview-wrapper').default;

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const render = async (props: Record<string, unknown>) => {
      await act(async () => {
        root.render(React.createElement(RawWebView, { filePath: 'index.tsx', ...props }));
      });
    };

    const dispatchDOMReady = async () => {
      await act(async () => {
        webViewProps.onMessage({
          nativeEvent: { data: JSON.stringify({ type: '$$dom_ready', data: null }) },
        });
      });
    };

    return { injectJavaScript, render, dispatchDOMReady };
  }

  function readInjectedEvent(script: string): BridgeMessage<any> {
    const [, payload] = script.match(/new CustomEvent\("\$\$dom_event",([\s\S]*)\)\);/) ?? [];
    if (payload == null) {
      throw new Error(`Expected a script injecting a DOM event, got: ${script}`);
    }
    return JSON.parse(payload).detail;
  }

  it('should not inject anything before the DOM side is ready', async () => {
    const { injectJavaScript, render } = mountRawWebView();

    await render({ title: 'initial' });

    // The DOM side has no `$$props` listener yet, and on the first commit the
    // native view is not resolvable by tag, so this rejected instead.
    expect(injectJavaScript).not.toHaveBeenCalled();
  });

  it('should not inject props that change before the DOM side is ready', async () => {
    const { injectJavaScript, render } = mountRawWebView();

    await render({ title: 'initial' });
    await render({ title: 'updated-before-ready' });

    expect(injectJavaScript).not.toHaveBeenCalled();
  });

  it('should answer `$$dom_ready` with the props as they are at that point', async () => {
    const { injectJavaScript, render, dispatchDOMReady } = mountRawWebView();

    await render({ title: 'initial' });
    await render({ title: 'updated-before-ready' });
    await dispatchDOMReady();

    expect(injectJavaScript).toHaveBeenCalledTimes(1);
    expect(readInjectedEvent(injectJavaScript.mock.calls[0][0])).toEqual({
      type: '$$props',
      data: { names: [], props: { title: 'updated-before-ready' } },
    });
  });

  it('should emit prop updates once the DOM side is ready', async () => {
    const { injectJavaScript, render, dispatchDOMReady } = mountRawWebView();

    await render({ title: 'initial' });
    await dispatchDOMReady();
    await render({ title: 'updated-after-ready' });

    expect(injectJavaScript).toHaveBeenCalledTimes(2);
    expect(readInjectedEvent(injectJavaScript.mock.calls[1][0])).toEqual({
      type: '$$props',
      data: { names: [], props: { title: 'updated-after-ready' } },
    });
  });
});
