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

/** Development-only harness. The primitive itself is the native UIRuntime class. */
export async function runRuntimeChecks(): Promise<RuntimeChecks> {
  const module = NativeModules.UIRuntimeChecks;
  if (!module) throw new Error('Rebuild the iOS app to install UIRuntimePrimitive.');

  const appGlobal = globalThis as typeof globalThis & { __uiRuntimeStepOneAppMarker?: string };
  const previous = appGlobal.__uiRuntimeStepOneAppMarker;
  appGlobal.__uiRuntimeStepOneAppMarker = 'This belongs only to the app runtime';
  try {
    return await module.run();
  } finally {
    if (previous === undefined) delete appGlobal.__uiRuntimeStepOneAppMarker;
    else appGlobal.__uiRuntimeStepOneAppMarker = previous;
  }
}
