// @flow

export default class HttpMetric {
  url: string;

  httpMethod: string;

  _nativeModule: object;

  constructor(nativeModule, url: string, httpMethod: string) {
    this._nativeModule = nativeModule;
    this.url = url;
    this.httpMethod = httpMethod;
  }

  getAttribute(attribute: string): Promise<string | null> {
    return this._nativeModule.getHttpMetricAttribute(this.url, this.httpMethod, attribute);
  }

  getAttributes(): Promise<Object> {
    return this._nativeModule.getHttpMetricAttributes(this.url, this.httpMethod);
  }

  putAttribute(attribute: string, value: string): Promise<true | false> {
    return this._nativeModule.putHttpMetricAttribute(this.url, this.httpMethod, attribute, value);
  }

  removeAttribute(attribute: string): Promise<null> {
    return this._nativeModule.removeHttpMetricAttribute(this.url, this.httpMethod, attribute);
  }

  setHttpResponseCode(code: number): Promise<null> {
    return this._nativeModule.setHttpMetricResponseCode(this.url, this.httpMethod, code);
  }

  setRequestPayloadSize(bytes: number): Promise<null> {
    return this._nativeModule.setHttpMetricRequestPayloadSize(this.url, this.httpMethod, bytes);
  }

  setResponseContentType(type: string): Promise<null> {
    return this._nativeModule.setHttpMetricResponseContentType(this.url, this.httpMethod, type);
  }

  setResponsePayloadSize(bytes: number): Promise<null> {
    return this._nativeModule.setHttpMetricResponsePayloadSize(this.url, this.httpMethod, bytes);
  }

  start(): Promise<null> {
    return this._nativeModule.startHttpMetric(this.url, this.httpMethod);
  }

  stop(): Promise<null> {
    return this._nativeModule.stopHttpMetric(this.url, this.httpMethod);
  }
}
