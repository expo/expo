import { EventEmitter, NativeModule, SharedObject, SharedRef } from './CoreModule';
import uuid from '../uuid';

export function registerWebGlobals() {
  if (globalThis.expo) return;
  globalThis.expo = {
    EventEmitter,
    NativeModule,
    SharedObject,
    SharedRef,
    modules: globalThis.ExpoDomWebView?.expoModulesProxy ?? {},
    uuidv4: uuid.v4,
    uuidv5: uuid.v5,
    getViewConfig: () => {
      throw new Error('Method not implemented.');
    },
    reloadAppAsync: async () => {
      window.location.reload();
    },
  };
}

registerWebGlobals();
