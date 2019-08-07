export declare type ParsedURL = {
    path: string | null;
    queryParams: Object | null;
};
export declare type EventType = {
    url: string;
    nativeEvent: MessageEvent;
};
export declare type URLListener = (event: EventType) => void;
export declare type NativeURLListener = (nativeEvent: MessageEvent) => void;
