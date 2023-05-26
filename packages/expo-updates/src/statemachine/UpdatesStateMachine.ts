import { createMachine, assign } from 'xstate';

/**
 * The context structure (analogous to what is exposed in @expo/use-updates)
 */
export interface UpdatesContext {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  latestUpdateId?: number;
  isChecking: boolean;
  isDownloading: boolean;
  downloadedUpdateId?: number;
  checkError?: Error;
  downloadError?: Error;
}

/**
 * Actions that modify the context
 */
const newManifestOnServer = assign({
  latestUpdateId: (context: UpdatesContext, event: any) =>
    event.updateId || (context?.latestUpdateId || 0) + 1,
  checkError: () => undefined,
  isChecking: () => false,
  isUpdateAvailable: () => true,
});

const sameManifestOnServer = assign({
  latestUpdateId: (context: UpdatesContext) => context?.latestUpdateId || 0,
  checkError: () => undefined,
  isChecking: () => false,
  isUpdateAvailable: () => true,
});

const manifestDownloaded = assign({
  downloadedUpdateId: (context: UpdatesContext, event: any) =>
    event.updateId || context?.latestUpdateId || 0,
  downloadError: () => undefined,
  isDownloading: () => false,
  isUpdatePending: () => true,
});

const noManifestOnServer = assign({
  latestUpdateId: (context: UpdatesContext) => undefined,
  checkError: () => undefined,
  isChecking: () => false,
  isUpdateAvailable: () => false,
});

const checkErrorOccurred = assign({
  checkError: () => new Error('checkError'),
  isChecking: () => false,
});

const downloadErrorOccurred = assign({
  downloadError: () => new Error('downloadError'),
  isDownloading: () => false,
});

const checkNow = assign({
  isChecking: (context: UpdatesContext) => true,
});

const downloadNow = assign({
  isDownloading: (context: UpdatesContext) => true,
});

/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
export const UpdatesStateMachine = createMachine<UpdatesContext>({
  id: 'Updates',
  initial: 'idle',
  context: {
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
  },
  states: {
    idle: {
      on: {
        CHECK: {
          target: 'checking',
          actions: checkNow,
        },
        DOWNLOAD: {
          target: 'downloading',
          actions: downloadNow,
        },
        RESTART: {
          target: 'restarting',
        },
      },
    },
    checking: {
      on: {
        CHECK_COMPLETE_AVAILABLE_NEW: {
          target: 'idle',
          actions: [newManifestOnServer],
        },
        CHECK_COMPLETE_AVAILABLE_UNCHANGED: {
          target: 'idle',
          actions: [sameManifestOnServer],
        },
        CHECK_COMPLETE_UNAVAILABLE: {
          target: 'idle',
          actions: [noManifestOnServer],
        },
        CHECK_ERROR: {
          target: 'idle',
          actions: [checkErrorOccurred],
        },
      },
    },
    downloading: {
      on: {
        DOWNLOAD_COMPLETE_NEW: {
          target: 'idle',
          actions: [newManifestOnServer, manifestDownloaded],
        },
        DOWNLOAD_COMPLETE_UNCHANGED: {
          target: 'idle',
          actions: [manifestDownloaded],
        },
        DOWNLOAD_ERROR: {
          target: 'idle',
          actions: [downloadErrorOccurred],
        },
      },
    },
    restarting: {
      type: 'final',
    },
  },
});
