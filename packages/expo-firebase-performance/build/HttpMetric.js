export default class HttpMetric {
    constructor(nativeModule, url, httpMethod) {
        this._nativeModule = nativeModule;
        this.url = url;
        this.httpMethod = httpMethod;
    }
    getAttribute(attribute) {
        return this._nativeModule.getHttpMetricAttribute(this.url, this.httpMethod, attribute);
    }
    getAttributes() {
        return this._nativeModule.getHttpMetricAttributes(this.url, this.httpMethod);
    }
    putAttribute(attribute, value) {
        return this._nativeModule.putHttpMetricAttribute(this.url, this.httpMethod, attribute, value);
    }
    removeAttribute(attribute) {
        return this._nativeModule.removeHttpMetricAttribute(this.url, this.httpMethod, attribute);
    }
    setHttpResponseCode(code) {
        return this._nativeModule.setHttpMetricResponseCode(this.url, this.httpMethod, code);
    }
    setRequestPayloadSize(bytes) {
        return this._nativeModule.setHttpMetricRequestPayloadSize(this.url, this.httpMethod, bytes);
    }
    setResponseContentType(type) {
        return this._nativeModule.setHttpMetricResponseContentType(this.url, this.httpMethod, type);
    }
    setResponsePayloadSize(bytes) {
        return this._nativeModule.setHttpMetricResponsePayloadSize(this.url, this.httpMethod, bytes);
    }
    start() {
        return this._nativeModule.startHttpMetric(this.url, this.httpMethod);
    }
    stop() {
        return this._nativeModule.stopHttpMetric(this.url, this.httpMethod);
    }
}
//# sourceMappingURL=HttpMetric.js.map