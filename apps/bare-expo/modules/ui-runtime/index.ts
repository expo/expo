import { NativeModules } from 'react-native';

export type RuntimeChecks = {
  uiThread: boolean;
  appIsolation: boolean;
  persistentState: boolean;
  independentInstances: boolean;
  errorRecovery: boolean;
  jsonBoundary: boolean;
  closeAndRecreate: boolean;
  backgroundCreationRejected: boolean;
};

export type QueueChecks = {
  immediateExecution: boolean;
  deferredFIFO: boolean;
  immediatePriority: boolean;
  nestedScheduling: boolean;
  reentrancyRejected: boolean;
  errorRecovery: boolean;
  mainQueueInterleaving: boolean;
  closeAndCancellation: boolean;
};

/** Development-only checks for step 2; not an application scheduling API. */
export async function runQueueChecks(): Promise<QueueChecks> {
  const module = NativeModules.UIExecutionQueueChecks;
  if (!module) throw new Error('Rebuild the iOS app to install the UI execution queue checks.');
  return await module.run();
}

/** Development-only harness. The primitive itself is the native UIRuntime class. */
export async function runRuntimeChecks(): Promise<RuntimeChecks> {
  const module = NativeModules.UIRuntimeChecks;
  if (!module) throw new Error('Rebuild the iOS app to install UIRuntimePrimitive.');

  const appGlobal = globalThis as typeof globalThis & {
    __uiRuntimeStepOneAppMarker?: string;
  };
  const previous = appGlobal.__uiRuntimeStepOneAppMarker;
  appGlobal.__uiRuntimeStepOneAppMarker = 'This belongs only to the app runtime';
  try {
    return await module.run();
  } finally {
    if (previous === undefined) delete appGlobal.__uiRuntimeStepOneAppMarker;
    else appGlobal.__uiRuntimeStepOneAppMarker = previous;
  }
}
