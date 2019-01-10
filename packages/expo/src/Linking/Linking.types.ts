export type ParsedURL = {
  path: string | null;
  queryParams: Object | null;
};

export type EventType = { url: string; nativeEvent: MessageEvent };

export type Listener = (event: EventType) => void;

export type NativeListener = (nativeEvent: MessageEvent) => void;
