// Copyright © 2024 650 Industries.
import type { TurboModule, EventSubscription } from 'react-native';

function addListener(eventName: string, listener: (...args: any[]) => any): EventSubscription
{
  const eventEmitter = this[eventName];
  if (this.addListener) {
    this.addListener(eventName);
  }
  return eventEmitter(listener);
}

export function createTurboModuleToExpoProxy(turboModule: TurboModule | null, name: string) {
  if (!turboModule)
    return null;

  const expoModuleProxy: any = {
    __turboModule: turboModule,
  };

  Object.keys(Object.getPrototypeOf(turboModule)).forEach((prop) => {
    expoModuleProxy[prop] = turboModule[prop];
  });

  if (turboModule.getConstants) {
    const constants = turboModule.getConstants();
    Object.keys(constants).forEach((prop) => {
      expoModuleProxy[prop] = constants[prop];
    });
  }

  expoModuleProxy.addListener = addListener.bind(turboModule);

  return expoModuleProxy;
}
