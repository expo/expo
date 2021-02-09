import { NativeModulesProxy } from '@unimodules/core';

export default NativeModulesProxy.ExpoAppleAuthentication ||
  ({
    isAvailableAsync(): Promise<boolean> {
      return Promise.resolve(false);
    },
  } as any);
