// Copyright © 2024 650 Industries.
import type { TurboModule, EventSubscription } from 'react-native';

export function createTurboModuleToExpoProxy(turboModule: TurboModule | null, name: string) {
  if (!turboModule) return null;

  const expoModuleProxy: any = {
    __turboModule: turboModule,
  };

  Object.keys(Object.getPrototypeOf(turboModule)).forEach((prop) => {
    expoModuleProxy[prop] = (turboModule as any)[prop];
  });

  if (turboModule.getConstants) {
    const constants = turboModule.getConstants();
    Object.keys(constants).forEach((prop) => {
      expoModuleProxy[prop] = (constants as any)[prop];
    });
  }

  expoModuleProxy.addListener = (
    eventName: string,
    listener: (...args: any[]) => any
  ): EventSubscription => {
    const eventEmitter = (turboModule as any)[eventName];
    return eventEmitter(listener);
  };

  return expoModuleProxy;
}
