import type { ParsedQs } from 'qs';
export type QueryParams = ParsedQs;
export type ParsedURL = {
    scheme: string | null;
    hostname: string | null;
    /**
     * The path into the app specified by the URL.
     */
    path: string | null;
    /**
     * The set of query parameters specified by the query string of the url used to open the app.
     */
    queryParams: QueryParams | null;
};
export type CreateURLOptions = {
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
export type EventType = {
    url: string;
    nativeEvent?: MessageEvent;
};
export type URLListener = (event: EventType) => void;
export type NativeURLListener = (nativeEvent: MessageEvent) => void;
export type SendIntentExtras = {
    key: string;
    value: string | number | boolean;
};
//# sourceMappingURL=Linking.types.d.ts.map