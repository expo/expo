// Copyright © 2024 650 Industries.
// NOTE: Forcing this to be a client boundary so the errors are a bit clearer. In the future we can
// make this a shim on the server by ignoring the globals that are missing in React Server contexts (Node.js).
'use client';

import { NativeModules } from 'react-native';

import type { ProxyNativeModule } from './NativeModulesProxy.types';

const LegacyNativeProxy = NativeModules?.NativeUnimoduleProxy;
// Fixes `cannot find name 'global'.` in tests
// @ts-ignore
const ExpoNativeProxy = global.expo?.modules?.NativeModulesProxy;

const modulesConstantsKey = 'modulesConstants';
const exportedMethodsKey = 'exportedMethods';

/**
 * @deprecated `NativeModulesProxy` is deprecated and might be removed in the future releases.
 * Use `requireNativeModule` or `requireOptionalNativeModule` instead.
 */
const NativeModulesProxy: Record<string, ProxyNativeModule> = {};

if (LegacyNativeProxy) {
  // use JSI proxy if available, fallback to legacy RN proxy
  const NativeProxy = ExpoNativeProxy ?? LegacyNativeProxy;

  Object.keys(NativeProxy[exportedMethodsKey]).forEach((moduleName) => {
    // copy constants
    NativeModulesProxy[moduleName] = NativeProxy[modulesConstantsKey][moduleName] || {};

    // copy methods
    // TODO(@kitten): Annotate `NativeProxy` with abstract types to avoid implicit `any`
    NativeProxy[exportedMethodsKey][moduleName].forEach((methodInfo: any) => {
      NativeModulesProxy[moduleName][methodInfo.name] = (...args: unknown[]): Promise<any> => {
        // Use the new proxy to call methods on legacy modules, if possible.
        if (ExpoNativeProxy?.callMethod) {
          return ExpoNativeProxy.callMethod(moduleName, methodInfo.name, args);
        }

        // Otherwise fall back to the legacy proxy.
        // This is deprecated and might be removed in SDK47 or later.
        const { key, argumentsCount } = methodInfo;
        if (argumentsCount !== args.length) {
          return Promise.reject(
            new Error(
              `Native method ${moduleName}.${methodInfo.name} expects ${argumentsCount} ${
                argumentsCount === 1 ? 'argument' : 'arguments'
              } but received ${args.length}`
            )
          );
        }
        return LegacyNativeProxy.callMethod(moduleName, key, args);
      };
    });
  });
}

export default NativeModulesProxy;
