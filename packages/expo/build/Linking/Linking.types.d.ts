export declare type QueryParams = {
    [key: string]: string | undefined;
};
export declare type ParsedURL = {
    scheme: string | null;
    hostname: string | null;
    path: string | null;
    queryParams: QueryParams | null;
};
export declare type EventType = {
    url: string;
    nativeEvent: MessageEvent;
};
export declare type URLListener = (event: EventType) => void;
export declare type NativeURLListener = (nativeEvent: MessageEvent) => void;
