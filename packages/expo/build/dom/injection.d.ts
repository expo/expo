import type { BridgeMessage } from './dom.types';
export declare const NATIVE_ACTION = "$$native_action";
export declare const NATIVE_ACTION_RESULT = "$$native_action_result";
export declare const DOM_EVENT = "$$dom_event";
export declare const STRETCH_WEBVIEW_EVENT = "$$stretch_webview_event";
export declare const getInjectEventScript: <T extends BridgeMessage<any>>(detail: T) => string;
export declare function getInjectEnvsScript(): string;
export declare function getInjectBodySizeObserverScript(): string;
//# sourceMappingURL=injection.d.ts.map