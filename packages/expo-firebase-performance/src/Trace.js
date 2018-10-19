// @flow
import type PerformanceMonitoring from '.';

export default class Trace {
  identifier: string;
  _perf: PerformanceMonitoring;

  constructor(perf: PerformanceMonitoring, identifier: string) {
    this._perf = perf;
    this.identifier = identifier;
  }

  getAttribute(attribute: string): Promise<string | null> {
    return this._perf.nativeModule.getTraceAttribute(this.identifier, attribute);
  }

  getAttributes(): Promise<Object> {
    return this._perf.nativeModule.getTraceAttributes(this.identifier);
  }

  getMetric(metricName: string): Promise<number> {
    return this._perf.nativeModule.getTraceLongMetric(this.identifier, metricName);
  }

  incrementMetric(metricName: string, incrementBy: number): Promise<null> {
    return this._perf.nativeModule.incrementTraceMetric(this.identifier, metricName, incrementBy);
  }

  putAttribute(attribute: string, value: string): Promise<true | false> {
    return this._perf.nativeModule.putTraceAttribute(this.identifier, attribute, value);
  }

  putMetric(metricName: string, value: number): Promise<null> {
    return this._perf.nativeModule.putTraceMetric(this.identifier, metricName, value);
  }

  removeAttribute(attribute: string): Promise<null> {
    return this._perf.nativeModule.removeTraceAttribute(this.identifier, attribute);
  }

  start(): Promise<null> {
    return this._perf.nativeModule.startTrace(this.identifier);
  }

  stop(): Promise<null> {
    return this._perf.nativeModule.stopTrace(this.identifier);
  }
}
