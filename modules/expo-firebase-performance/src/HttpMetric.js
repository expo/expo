/**
 * @flow
 * Trace representation wrapper
 */
import { getNativeModule } from 'expo-firebase-app';
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
    return getNativeModule(this._perf).getHttpMetricAttribute(this.url, this.httpMethod, attribute);
  }

  getAttributes(): Promise<Object> {
    return getNativeModule(this._perf).getHttpMetricAttributes(this.url, this.httpMethod);
  }

  putAttribute(attribute: string, value: string): Promise<true | false> {
    return getNativeModule(this._perf).putHttpMetricAttribute(
      this.url,
      this.httpMethod,
      attribute,
      value
    );
  }

  removeAttribute(attribute: string): Promise<null> {
    return getNativeModule(this._perf).removeHttpMetricAttribute(
      this.url,
      this.httpMethod,
      attribute
    );
  }

  setHttpResponseCode(code: number): Promise<null> {
    return getNativeModule(this._perf).setHttpMetricResponseCode(this.url, this.httpMethod, code);
  }

  setRequestPayloadSize(bytes: number): Promise<null> {
    return getNativeModule(this._perf).setHttpMetricRequestPayloadSize(
      this.url,
      this.httpMethod,
      bytes
    );
  }

  setResponseContentType(type: string): Promise<null> {
    return getNativeModule(this._perf).setHttpMetricResponseContentType(
      this.url,
      this.httpMethod,
      type
    );
  }

  setResponsePayloadSize(bytes: number): Promise<null> {
    return getNativeModule(this._perf).setHttpMetricResponsePayloadSize(
      this.url,
      this.httpMethod,
      bytes
    );
  }

  start(): Promise<null> {
    return getNativeModule(this._perf).startHttpMetric(this.url, this.httpMethod);
  }

  stop(): Promise<null> {
    return getNativeModule(this._perf).stopHttpMetric(this.url, this.httpMethod);
  }
}
