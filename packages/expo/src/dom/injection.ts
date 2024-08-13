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
