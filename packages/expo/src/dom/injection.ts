import type { BridgeMessage } from './www-types';

export const NATIVE_ACTION = '$$native_action';
export const NATIVE_ACTION_RESULT = '$$native_action_result';
export const DOM_EVENT = '$$dom_event';

export const getInjectEventScript = <T extends BridgeMessage<any>>(detail: T) => {
  return `;(function() {
  try {
  window.dispatchEvent(new CustomEvent("${DOM_EVENT}",${JSON.stringify({ detail })}));
  } catch (e) {}
  })();
  true;`;
};

export function getInjectEnvsScript() {
  return `;(function injectEnvs() {
  let domBaseUrl = '';
  if (window.location.protocol === 'file:') {
    domBaseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
  }
  window.process = window.process || {};
  window.process.env = {
    ...(window.process.env || {}),
    EXPO_DOM_BASE_URL: domBaseUrl,
  };
  })();
  true;`;
}
