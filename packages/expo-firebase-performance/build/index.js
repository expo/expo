import { ModuleBase } from 'expo-firebase-app';
import invariant from 'invariant';
import HttpMetric from './HttpMetric';
import Trace from './Trace';
export const MODULE_NAME = 'ExpoFirebasePerformance';
export const NAMESPACE = 'perf';
export const statics = {};
const HTTP_METHODS = {
    CONNECT: true,
    DELETE: true,
    GET: true,
    HEAD: true,
    OPTIONS: true,
    PATCH: true,
    POST: true,
    PUT: true,
    TRACE: true,
};
export default class PerformanceMonitoring extends ModuleBase {
    constructor(app) {
        super(app, {
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            hasCustomUrlSupport: false,
            namespace: NAMESPACE,
        });
    }
    /**
     * Globally enable or disable performance monitoring
     * @param enabled
     * @returns {*}
     */
    async setPerformanceCollectionEnabled(enabled) {
        invariant(typeof enabled === 'boolean', 'firebase.perf().setPerformanceCollectionEnabled() requires a boolean value');
        return await this.nativeModule.setPerformanceCollectionEnabled(enabled);
    }
    /**
     * Returns a new trace instance
     * @param trace
     */
    newTrace(trace) {
        invariant(typeof trace === 'string', 'firebase.perf().newTrace() requires a string value');
        return new Trace(this.nativeModule, trace);
    }
    /**
     * Return a new HttpMetric instance
     * @param url
     * @param httpMethod
     * @returns {HttpMetric}
     */
    newHttpMetric(url, httpMethod) {
        invariant(typeof url === 'string', 'firebase.perf().newHttpMetric() requires url to be a string value');
        invariant(typeof httpMethod === 'string', 'firebase.perf().newHttpMetric() requires httpMethod to be a string value');
        invariant(HTTP_METHODS[httpMethod], `firebase.perf().newHttpMetric() httpMethod should be one of ${Object.keys(HTTP_METHODS).join(', ')}`);
        return new HttpMetric(this.nativeModule, url, httpMethod);
    }
}
PerformanceMonitoring.moduleName = MODULE_NAME;
PerformanceMonitoring.namespace = NAMESPACE;
PerformanceMonitoring.statics = statics;
export { Trace, HttpMetric, HTTP_METHODS };
//# sourceMappingURL=index.js.map