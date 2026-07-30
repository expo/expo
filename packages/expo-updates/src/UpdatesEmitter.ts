import ExpoUpdatesModule from './ExpoUpdates';
import type {
  UpdatesNativeStateChangeEvent,
  UpdatesNativeStateMachineContext,
} from './Updates.types';

export let latestContext = transformNativeStateMachineContext(ExpoUpdatesModule.initialContext);

// The native module instance lives on the global object and therefore outlives this module's
// scope (see `requireNativeModule` and `registerWebModule`). Whenever this module is evaluated
// again against the same global — which happens once per request when the server rendering
// runtime recreates the module graph, and on Fast Refresh — adding another listener would stack
// a subscription that keeps the entire previous module scope alive. Dropping the previous
// listener first keeps exactly one live subscription at all times.
ExpoUpdatesModule.removeAllListeners('Expo.nativeUpdatesStateChangeEvent');
ExpoUpdatesModule.addListener('Expo.nativeUpdatesStateChangeEvent', _handleNativeStateChangeEvent);

interface UpdatesStateChangeSubscription {
  remove(): void;
}

const _updatesStateChangeListeners = new Set<(event: UpdatesNativeStateChangeEvent) => void>();

// Reemits native state change events
function _handleNativeStateChangeEvent(params: any) {
  const newParams = typeof params === 'string' ? JSON.parse(params) : { ...params };
  const transformedContext = transformNativeStateMachineContext(newParams.context);

  // only process state change events if they are in order
  if (transformedContext.sequenceNumber <= latestContext.sequenceNumber) {
    return;
  }

  newParams.context = transformedContext;
  latestContext = transformedContext;
  _updatesStateChangeListeners.forEach((listener) => listener(newParams));
}

/**
 * Add listener for state change events
 * @hidden
 */
export const addUpdatesStateChangeListener = (
  listener: (event: UpdatesNativeStateChangeEvent) => void
): UpdatesStateChangeSubscription => {
  _updatesStateChangeListeners.add(listener);
  return {
    remove() {
      _updatesStateChangeListeners.delete(listener);
    },
  };
};

/**
 * Allows JS test to emit a simulated native state change event (used in unit testing)
 * @hidden
 */
export const emitTestStateChangeEvent = (event: UpdatesNativeStateChangeEvent) => {
  _handleNativeStateChangeEvent(event);
};

/**
 * Allows JS test to reset latest context (and sequence number)
 * @hidden
 */
export const resetLatestContext = () => {
  latestContext = transformNativeStateMachineContext(ExpoUpdatesModule.initialContext);
};

function transformNativeStateMachineContext(
  originalNativeContext: UpdatesNativeStateMachineContext & {
    latestManifestString?: string;
    downloadedManifestString?: string;
    lastCheckForUpdateTimeString?: string;
    rollbackString?: string;
  }
): UpdatesNativeStateMachineContext {
  const nativeContext = { ...originalNativeContext };
  if (nativeContext.latestManifestString) {
    nativeContext.latestManifest = JSON.parse(nativeContext.latestManifestString);
    delete nativeContext.latestManifestString;
  }
  if (nativeContext.downloadedManifestString) {
    nativeContext.downloadedManifest = JSON.parse(nativeContext.downloadedManifestString);
    delete nativeContext.downloadedManifestString;
  }
  if (nativeContext.lastCheckForUpdateTimeString) {
    nativeContext.lastCheckForUpdateTime = new Date(nativeContext.lastCheckForUpdateTimeString);
    delete nativeContext.lastCheckForUpdateTimeString;
  }
  if (nativeContext.rollbackString) {
    nativeContext.rollback = JSON.parse(nativeContext.rollbackString);
    delete nativeContext.rollbackString;
  }
  return nativeContext;
}
