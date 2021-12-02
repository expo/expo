import { ParsedQs } from 'qs';

// @docsMissing
export type QueryParams = ParsedQs;

// @needsAudit @docsMissing
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

// @needsAudit
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

// @docsMissing
export type EventType = {
  url: string;
  nativeEvent?: MessageEvent;
};

// @docsMissing
export type URLListener = (event: EventType) => void;

// @docsMissing
export type NativeURLListener = (nativeEvent: MessageEvent) => void;

// @docsMissing
export type SendIntentExtras = { key: string; value: string | number | boolean };
