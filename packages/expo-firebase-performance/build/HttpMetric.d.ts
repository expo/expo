export default class HttpMetric {
    url: string;
    httpMethod: string;
    _nativeModule: any;
    constructor(nativeModule: any, url: string, httpMethod: string);
    getAttribute(attribute: string): Promise<string | null>;
    getAttributes(): Promise<Object>;
    putAttribute(attribute: string, value: string): Promise<true | false>;
    removeAttribute(attribute: string): Promise<null>;
    setHttpResponseCode(code: number): Promise<null>;
    setRequestPayloadSize(bytes: number): Promise<null>;
    setResponseContentType(type: string): Promise<null>;
    setResponsePayloadSize(bytes: number): Promise<null>;
    start(): Promise<null>;
    stop(): Promise<null>;
}
