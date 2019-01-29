export default class Trace {
  identifier: string;
  _nativeModule: any;

  constructor(nativeModule: any, identifier: string) {
    this._nativeModule = nativeModule;
    this.identifier = identifier;
  }

  async getAttribute(attribute: string): Promise<string | null> {
    return await this._nativeModule.getTraceAttribute(this.identifier, attribute);
  }

  async getAttributes(): Promise<Object> {
    return await this._nativeModule.getTraceAttributes(this.identifier);
  }

  async getMetric(metricName: string): Promise<number> {
    return await this._nativeModule.getTraceLongMetric(this.identifier, metricName);
  }

  async incrementMetric(metricName: string, incrementBy: number): Promise<null> {
    return await this._nativeModule.incrementTraceMetric(this.identifier, metricName, incrementBy);
  }

  async putAttribute(attribute: string, value: string): Promise<boolean> {
    return await this._nativeModule.putTraceAttribute(this.identifier, attribute, value);
  }

  async putMetric(metricName: string, value: number): Promise<null> {
    return await this._nativeModule.putTraceMetric(this.identifier, metricName, value);
  }

  async removeAttribute(attribute: string): Promise<null> {
    return await this._nativeModule.removeTraceAttribute(this.identifier, attribute);
  }

  async start(): Promise<null> {
    return await this._nativeModule.startTrace(this.identifier);
  }

  async stop(): Promise<null> {
    return await this._nativeModule.stopTrace(this.identifier);
  }
}
