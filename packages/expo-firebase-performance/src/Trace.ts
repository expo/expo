// @flow

export default class Trace {
  identifier: string;
  _nativeModule: any;

  constructor(nativeModule, identifier: string) {
    this._nativeModule = nativeModule;
    this.identifier = identifier;
  }

  getAttribute(attribute: string): Promise<string | null> {
    return this._nativeModule.getTraceAttribute(this.identifier, attribute);
  }

  getAttributes(): Promise<Object> {
    return this._nativeModule.getTraceAttributes(this.identifier);
  }

  getMetric(metricName: string): Promise<number> {
    return this._nativeModule.getTraceLongMetric(this.identifier, metricName);
  }

  incrementMetric(metricName: string, incrementBy: number): Promise<null> {
    return this._nativeModule.incrementTraceMetric(this.identifier, metricName, incrementBy);
  }

  putAttribute(attribute: string, value: string): Promise<true | false> {
    return this._nativeModule.putTraceAttribute(this.identifier, attribute, value);
  }

  putMetric(metricName: string, value: number): Promise<null> {
    return this._nativeModule.putTraceMetric(this.identifier, metricName, value);
  }

  removeAttribute(attribute: string): Promise<null> {
    return this._nativeModule.removeTraceAttribute(this.identifier, attribute);
  }

  start(): Promise<null> {
    return this._nativeModule.startTrace(this.identifier);
  }

  stop(): Promise<null> {
    return this._nativeModule.stopTrace(this.identifier);
  }
}
