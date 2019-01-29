// @flow
import { ModuleBase } from 'expo-firebase-app';
import invariant from 'invariant';
import type { App } from 'expo-firebase-app';
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

type HttpMethod =
  | 'CONNECT'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT'
  | 'TRACE';

export default class PerformanceMonitoring extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  constructor(app: App) {
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
  setPerformanceCollectionEnabled(enabled: boolean): Promise {
    invariant(
      typeof enabled === 'boolean',
      'firebase.perf().setPerformanceCollectionEnabled() requires a boolean value'
    );
    return this.nativeModule.setPerformanceCollectionEnabled(enabled);
  }

  /**
   * Returns a new trace instance
   * @param trace
   */
  newTrace(trace: string): ?Trace {
    invariant(typeof trace === 'string', 'firebase.perf().newTrace() requires a string value');
    return new Trace(this.nativeModule, trace);
  }

  /**
   * Return a new HttpMetric instance
   * @param url
   * @param httpMethod
   * @returns {HttpMetric}
   */
  newHttpMetric(url: string, httpMethod: HttpMethod): HttpMetric {
    invariant(
      typeof url === 'string',
      'firebase.perf().newHttpMetric() requires url to be a string value'
    );
    invariant(
      typeof httpMethod === 'string',
      'firebase.perf().newHttpMetric() requires httpMethod to be a string value'
    );
    invariant(
      HTTP_METHODS[httpMethod],
      `firebase.perf().newHttpMetric() httpMethod should be one of ${Object.keys(HTTP_METHODS).join(
        ', '
      )}`
    );

    return new HttpMetric(this.nativeModule, url, httpMethod);
  }
}

export { Trace, HttpMetric, HTTP_METHODS };

export type { HttpMethod };
