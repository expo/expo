import { serializeArgs } from './utils';

export function createSharedObjectProxy(sharedObjectId: number): any {
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        const name = String(prop);
        if (name === 'sharedObjectId') {
          return sharedObjectId;
        }
        return function (...args: any[]) {
          const serializedArgs = serializeArgs(args);
          const source = `globalThis.expo.sharedObjectRegistry.get(${sharedObjectId})?.${name}?.call(globalThis.expo.sharedObjectRegistry.get(${sharedObjectId}),${serializedArgs})`;
          return window.ExpoDomWebView.eval(source);
        };
      },
    }
  );
}

export function createConstructorProxy(
  moduleName: string,
  property: string,
  propertyName: string
): any {
  return new Proxy(function () {}, {
    construct(target, args) {
      const serializedArgs = serializeArgs(args);
      const sharedObjectId = window.ExpoDomWebView.nextSharedObjectId++;
      const sharedObjectProxy = createSharedObjectProxy(sharedObjectId);
      window.ExpoDomWebView.sharedObjectFinalizationRegistry.register(
        sharedObjectProxy,
        sharedObjectId
      );
      const source = `globalThis.expo.sharedObjectRegistry ||= new Map(); globalThis.expo.sharedObjectRegistry.set(${sharedObjectId}, new ${property}(${serializedArgs}));`;
      window.ExpoDomWebView.eval(source);
      return sharedObjectProxy;
    },
  });
}

export function createPropertyProxy(
  propertyTypeCache: Record<string, string>,
  moduleName: string,
  propertyName: string
): any {
  const property = `globalThis.expo.modules.${moduleName}.${propertyName}`;
  let propertyType = propertyTypeCache[propertyName];
  if (!propertyType) {
    const typeCheck = `${property}?.prototype?.__expo_shared_object_id__ != null ? 'sharedObject' : typeof ${property}`;
    propertyType = window.ExpoDomWebView.eval(typeCheck);
    propertyTypeCache[propertyName] = propertyType;
  }
  if (propertyType === 'sharedObject') {
    return createConstructorProxy(moduleName, property, propertyName);
  }
  if (propertyType === 'function') {
    return function (...args: any[]) {
      const serializedArgs = serializeArgs(args);
      const source = `${property}(${serializedArgs})`;
      return window.ExpoDomWebView.eval(source);
    };
  }
  return window.ExpoDomWebView.eval(property);
}

export function createExpoModuleProxy(moduleName: string): any {
  const propertyTypeCache: Record<string, string> = {};
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        const name = String(prop);
        if (['addListener', 'removeListener', 'removeAllListeners'].includes(name)) {
          return window.ExpoDomWebView.eventEmitterProxy[moduleName][name];
        }
        return createPropertyProxy(propertyTypeCache, moduleName, name);
      },
    }
  );
}
