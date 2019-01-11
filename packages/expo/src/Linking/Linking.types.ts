export type ParsedURL = {
  path: string | null;
  queryParams: Object | null;
};

export type EventType = { url: string; nativeEvent: MessageEvent };

export type URLListener = (event: EventType) => void;

export type NativeURLListener = (nativeEvent: MessageEvent) => void;
