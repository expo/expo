import { App, ModuleBase } from 'expo-firebase-app';
import HttpMetric from './HttpMetric';
import Trace from './Trace';
export declare const MODULE_NAME = "ExpoFirebasePerformance";
export declare const NAMESPACE = "perf";
export declare const statics: {};
declare const HTTP_METHODS: {
    CONNECT: boolean;
    DELETE: boolean;
    GET: boolean;
    HEAD: boolean;
    OPTIONS: boolean;
    PATCH: boolean;
    POST: boolean;
    PUT: boolean;
    TRACE: boolean;
};
declare type HttpMethod = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';
export default class PerformanceMonitoring extends ModuleBase {
    static moduleName: string;
    static namespace: string;
    static statics: {};
    constructor(app: App);
    /**
     * Globally enable or disable performance monitoring
     * @param enabled
     * @returns {*}
     */
    setPerformanceCollectionEnabled(enabled: boolean): Promise<void>;
    /**
     * Returns a new trace instance
     * @param trace
     */
    newTrace(trace: string): Trace | undefined;
    /**
     * Return a new HttpMetric instance
     * @param url
     * @param httpMethod
     * @returns {HttpMetric}
     */
    newHttpMetric(url: string, httpMethod: HttpMethod): HttpMetric;
}
export { HttpMethod, Trace, HttpMetric, HTTP_METHODS };
