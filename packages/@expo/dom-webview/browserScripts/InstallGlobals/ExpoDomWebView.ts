import { Deferred } from './Deferred';
import { EventEmitterProxy } from './EventEmitterProxy';
import { createExpoModuleProxy } from './proxies';

export class ExpoDomWebView {
  nextDeferredId: number;
  nextSharedObjectId: number;
  nextEventListenerId: number;
  deferredMap: Map<number, Deferred<any>>;
  sharedObjectFinalizationRegistry: FinalizationRegistry<number>;
  expoModulesProxy: Record<string, any>;
  eventEmitterProxy: Record<string, EventEmitterProxy>;

  constructor() {
    this.nextDeferredId = 0;
    this.nextSharedObjectId = 0;
    this.nextEventListenerId = 0;
    this.deferredMap = new Map();
    this.sharedObjectFinalizationRegistry = new FinalizationRegistry((sharedObjectId) => {
      this.eval(`globalThis.expo.sharedObjectRegistry.delete(${sharedObjectId})`);
    });

    const expoModules: Record<string, any> = {};
    const eventEmitterProxy: Record<string, EventEmitterProxy> = {};
    this.eval('Object.keys(globalThis.expo.modules)').forEach((name: string) => {
      expoModules[name] = createExpoModuleProxy(name);
      eventEmitterProxy[name] = new EventEmitterProxy(name);
    });
    this.expoModulesProxy = expoModules;
    this.eventEmitterProxy = eventEmitterProxy;
  }

  eval(source: string): any {
    const { deferredId, deferred } = this.createDeferred();
    const args = JSON.stringify({ source, deferredId });
    const result = JSON.parse(window.ExpoDomWebViewBridge.eval(args) as string);
    if (result.isPromise) {
      return deferred.getPromise();
    }
    this.removeDeferred(deferredId);
    return result.value;
  }

  createDeferred<T = any>(): { deferredId: number; deferred: Deferred<T> } {
    const deferred = new Deferred<T>();
    const deferredId = this.nextDeferredId;
    this.deferredMap.set(deferredId, deferred);
    this.nextDeferredId += 1;
    return { deferredId, deferred };
  }

  resolveDeferred(deferredId: number, value: any) {
    const deferred = this.deferredMap.get(deferredId);
    if (deferred) {
      deferred.resolve(value);
      this.deferredMap.delete(deferredId);
    }
  }

  rejectDeferred(deferredId: number, reason: any) {
    const deferred = this.deferredMap.get(deferredId);
    if (deferred) {
      deferred.reject(reason);
      this.deferredMap.delete(deferredId);
    }
  }

  removeDeferred(deferredId: number) {
    this.deferredMap.delete(deferredId);
  }
}
