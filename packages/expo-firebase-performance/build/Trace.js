export default class Trace {
    constructor(nativeModule, identifier) {
        this._nativeModule = nativeModule;
        this.identifier = identifier;
    }
    async getAttribute(attribute) {
        return await this._nativeModule.getTraceAttribute(this.identifier, attribute);
    }
    async getAttributes() {
        return await this._nativeModule.getTraceAttributes(this.identifier);
    }
    async getMetric(metricName) {
        return await this._nativeModule.getTraceLongMetric(this.identifier, metricName);
    }
    async incrementMetric(metricName, incrementBy) {
        return await this._nativeModule.incrementTraceMetric(this.identifier, metricName, incrementBy);
    }
    async putAttribute(attribute, value) {
        return await this._nativeModule.putTraceAttribute(this.identifier, attribute, value);
    }
    async putMetric(metricName, value) {
        return await this._nativeModule.putTraceMetric(this.identifier, metricName, value);
    }
    async removeAttribute(attribute) {
        return await this._nativeModule.removeTraceAttribute(this.identifier, attribute);
    }
    async start() {
        return await this._nativeModule.startTrace(this.identifier);
    }
    async stop() {
        return await this._nativeModule.stopTrace(this.identifier);
    }
}
//# sourceMappingURL=Trace.js.map