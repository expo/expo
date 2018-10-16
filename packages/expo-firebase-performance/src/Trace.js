/**
 * @flow
 * Trace representation wrapper
 */
import { getNativeModule } from 'expo-firebase-app';
import type PerformanceMonitoring from '.';

export default class Trace {
  identifier: string;
  _perf: PerformanceMonitoring;

  constructor(perf: PerformanceMonitoring, identifier: string) {
    this._perf = perf;
    this.identifier = identifier;
  }

  getAttribute(attribute: string): Promise<string | null> {
    return getNativeModule(this._perf).getTraceAttribute(this.identifier, attribute);
  }

  getAttributes(): Promise<Object> {
    return getNativeModule(this._perf).getTraceAttributes(this.identifier);
  }

  getMetric(metricName: string): Promise<number> {
    return getNativeModule(this._perf).getTraceLongMetric(this.identifier, metricName);
  }

  incrementMetric(metricName: string, incrementBy: number): Promise<null> {
    return getNativeModule(this._perf).incrementTraceMetric(
      this.identifier,
      metricName,
      incrementBy
    );
  }

  putAttribute(attribute: string, value: string): Promise<true | false> {
    return getNativeModule(this._perf).putTraceAttribute(this.identifier, attribute, value);
  }

  putMetric(metricName: string, value: number): Promise<null> {
    return getNativeModule(this._perf).putTraceMetric(this.identifier, metricName, value);
  }

  removeAttribute(attribute: string): Promise<null> {
    return getNativeModule(this._perf).removeTraceAttribute(this.identifier, attribute);
  }

  start(): Promise<null> {
    return getNativeModule(this._perf).startTrace(this.identifier);
  }

  stop(): Promise<null> {
    return getNativeModule(this._perf).stopTrace(this.identifier);
  }
}
