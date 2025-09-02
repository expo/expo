import { EventEmitter, NativeModule, SharedObject, SharedRef } from './CoreModule';
import uuid from '../uuid/index.web';

// jest-expo imports to this file directly without going through the global types
// Exporting the types to let jest-expo to know the globalThis types
export * from '../ts-declarations/global';

export function installExpoGlobalPolyfill() {
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

    expoModulesCoreVersion: undefined,
    cacheDir: undefined,
    documentsDir: undefined,
  };
}
