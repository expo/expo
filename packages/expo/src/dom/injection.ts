import type { BridgeMessage } from './dom.types';

export const NATIVE_ACTION = '$$native_action';
export const NATIVE_ACTION_RESULT = '$$native_action_result';
export const DOM_EVENT = '$$dom_event';
export const MATCH_CONTENTS_EVENT = '$$match_contents_event';
export const REGISTER_DOM_IMPERATIVE_HANDLE_PROPS = '$$register_dom_imperative_handle_props';

export const getInjectEventScript = <T extends BridgeMessage<any>>(detail: T) => {
  return `;(function() {
  try {
  window.dispatchEvent(new CustomEvent("${DOM_EVENT}",${JSON.stringify({ detail })}));
  } catch (e) {}
  })();
  true;`;
};

export function getInjectBodySizeObserverScript() {
  return `;(function observeDocumentBodySize() {
  if (window.ReactNativeWebView == null) {
    throw new Error(
      'window.ReactNativeWebView is not defined. This script should only be injected in a WebView environment.'
    );
  }

  function registerObserver() {
    new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: '${MATCH_CONTENTS_EVENT}',
        data: {
          width,
          height,
        },
      }));
    })
    .observe(document.body);
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: '${MATCH_CONTENTS_EVENT}',
      data: {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
      },
    }));
  }

  if (document.readyState !== 'loading') {
    registerObserver();
    return;
  }
  window.addEventListener('DOMContentLoaded', () => {
    registerObserver();
  });
  })();
  true;`;
}
