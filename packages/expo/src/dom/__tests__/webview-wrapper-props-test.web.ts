/**
 * @jest-environment jsdom
 */
// `.web.ts` and jsdom on purpose: the wrapper only runs on native, but the native
// projects cannot host a `react-dom` root, and `react-dom/server` does not run effects.
import type { BridgeMessage } from '../dom.types';

describe('$$props', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../utils/getDevServer', () => ({
      __esModule: true,
      default: () => ({ url: 'http://localhost:8081' }),
    }));
  });

  function mountRawWebView(props: Record<string, unknown>) {
    const injectJavaScript = jest.fn();
    let webViewProps: Record<string, any> = {};
    jest.doMock('@expo/dom-webview', () => ({
      WebView: (stubProps: any) => {
        webViewProps = stubProps;
        stubProps.ref.current = { injectJavaScript };
        return null;
      },
    }));
    const React = require('react');
    const { act } = React;
    const { createRoot } = require('react-dom/client');
    const RawWebView = require('../webview-wrapper').default;
    const root = createRoot(document.createElement('div'));

    function render(nextProps: Record<string, unknown>) {
      act(() =>
        root.render(React.createElement(RawWebView, { filePath: 'index.tsx', ...nextProps }))
      );
    }

    function sendDOMReady() {
      act(() => webViewProps.onMessage(domReadyEvent()));
    }

    function injectedProps() {
      return injectJavaScript.mock.calls
        .map(([script]) => readInjectedEvent(script))
        .filter((event) => event.type === '$$props')
        .map((event) => event.data.props);
    }

    render(props);
    return { render, sendDOMReady, injectedProps };
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

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  it('should be sent only after the DOM is ready', () => {
    const webView = mountRawWebView({ title: 'first' });
    expect(webView.injectedProps()).toEqual([]);

    webView.sendDOMReady();
    expect(webView.injectedProps()).toEqual([{ title: 'first' }]);

    webView.render({ title: 'second' });
    expect(webView.injectedProps()).toEqual([{ title: 'first' }, { title: 'second' }]);
  });

  it('should send the latest props when the DOM is ready', () => {
    const webView = mountRawWebView({ title: 'first' });
    webView.render({ title: 'second' });

    webView.sendDOMReady();

    expect(webView.injectedProps()).toEqual([{ title: 'second' }]);
  });
});
