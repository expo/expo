import { ParsedQs } from 'qs';
export declare type QueryParams = ParsedQs;
export declare type ParsedURL = {
    scheme: string | null;
    hostname: string | null;
    path: string | null;
    queryParams: QueryParams | null;
};
export declare type CreateURLOptions = {
    /**
     * URI protocol `<scheme>://` that must be built into your native app.
     */
    scheme?: string;
    /**
     * An object of parameters that will be converted into a query string.
     */
    queryParams?: QueryParams;
    /**
     * Should the URI be triple slashed `scheme:///path` or double slashed `scheme://path`.
     */
    isTripleSlashed?: boolean;
};
export declare type EventType = {
    url: string;
    nativeEvent?: MessageEvent;
};
export declare type URLListener = (event: EventType) => void;
export declare type NativeURLListener = (nativeEvent: MessageEvent) => void;
