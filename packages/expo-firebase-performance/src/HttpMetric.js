// @flow

import type PerformanceMonitoring from '.';

export default class HttpMetric {
  url: string;

  httpMethod: string;

  _perf: PerformanceMonitoring;

  constructor(perf: PerformanceMonitoring, url: string, httpMethod: string) {
    this._perf = perf;
    this.url = url;
    this.httpMethod = httpMethod;
  }

  getAttribute(attribute: string): Promise<string | null> {
    return this._perf.nativeModule.getHttpMetricAttribute(this.url, this.httpMethod, attribute);
  }

  getAttributes(): Promise<Object> {
    return this._perf.nativeModule.getHttpMetricAttributes(this.url, this.httpMethod);
  }

  putAttribute(attribute: string, value: string): Promise<true | false> {
    return this._perf.nativeModule.putHttpMetricAttribute(
      this.url,
      this.httpMethod,
      attribute,
      value
    );
  }

  removeAttribute(attribute: string): Promise<null> {
    return this._perf.nativeModule.removeHttpMetricAttribute(this.url, this.httpMethod, attribute);
  }

  setHttpResponseCode(code: number): Promise<null> {
    return this._perf.nativeModule.setHttpMetricResponseCode(this.url, this.httpMethod, code);
  }

  setRequestPayloadSize(bytes: number): Promise<null> {
    return this._perf.nativeModule.setHttpMetricRequestPayloadSize(
      this.url,
      this.httpMethod,
      bytes
    );
  }

  setResponseContentType(type: string): Promise<null> {
    return this._perf.nativeModule.setHttpMetricResponseContentType(
      this.url,
      this.httpMethod,
      type
    );
  }

  setResponsePayloadSize(bytes: number): Promise<null> {
    return this._perf.nativeModule.setHttpMetricResponsePayloadSize(
      this.url,
      this.httpMethod,
      bytes
    );
  }

  start(): Promise<null> {
    return this._perf.nativeModule.startHttpMetric(this.url, this.httpMethod);
  }

  stop(): Promise<null> {
    return this._perf.nativeModule.stopHttpMetric(this.url, this.httpMethod);
  }
}
