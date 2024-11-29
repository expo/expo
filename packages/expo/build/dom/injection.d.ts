import type { BridgeMessage } from './dom.types';
export declare const NATIVE_ACTION = "$$native_action";
export declare const NATIVE_ACTION_RESULT = "$$native_action_result";
export declare const DOM_EVENT = "$$dom_event";
export declare const MATCH_CONTENTS_EVENT = "$$match_contents_event";
export declare const REGISTER_DOM_IMPERATIVE_HANDLE_PROPS = "$$register_dom_imperative_handle_props";
export declare const getInjectEventScript: <T extends BridgeMessage<any>>(detail: T) => string;
export declare function getInjectBodySizeObserverScript(): string;
//# sourceMappingURL=injection.d.ts.map