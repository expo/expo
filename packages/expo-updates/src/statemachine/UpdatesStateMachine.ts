import { createMachine, assign } from 'xstate';

export enum UpdatesStateMachineEventTypes {
  CHECK = 'check',
  CHECK_COMPLETE_AVAILABLE = 'checkCompleteAvailable',
  CHECK_COMPLETE_UNAVAILABLE = 'checkCompleteUnavailable',
  CHECK_ERROR = 'checkError',
  DOWNLOAD = 'download',
  DOWNLOAD_COMPLETE = 'downloadComplete',
  DOWNLOAD_ERROR = 'downloadError',
  RESTART = 'restart',
}

/**
 * Simplified model for an update manifest
 */
export type Manifest = {
  updateId: string;
};

/**
 * Model for an update event
 */
export type UpdatesStateMachineEvent = {
  type: UpdatesStateMachineEventTypes;
  body: {
    message?: string;
    manifest?: Manifest;
    isRollBackToEmbedded?: boolean;
  };
};

/**
 * The context structure (analogous to what is exposed in @expo/use-updates)
 */
export interface UpdatesStateMachineContext {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  latestManifest?: Manifest;
  isChecking: boolean;
  isDownloading: boolean;
  isRollback: boolean;
  downloadedManifest?: Manifest;
  checkError?: Error;
  downloadError?: Error;
}

/**
 * Actions that modify the context
 */
const checkCompleteAvailableAction = assign({
  latestManifest: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    event.body?.manifest || undefined,
  checkError: () => undefined,
  isChecking: () => false,
  isUpdateAvailable: () => true,
  isRollback: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    Boolean(event.body?.isRollBackToEmbedded),
});

const checkCompleteUnavailableAction = assign({
  latestManifest: () => undefined,
  checkError: () => undefined,
  isChecking: () => false,
  isUpdateAvailable: () => false,
  isRollback: () => false,
});

const checkErrorAction = assign({
  isChecking: () => false,
  checkError: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    new Error(event.body?.message || 'checkError'),
});

const downloadCompleteAction = assign({
  downloadedManifest: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    event.body?.manifest || context.downloadedManifest,
  latestManifest: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    event.body?.manifest || context.latestManifest,
  downloadError: () => undefined,
  isDownloading: () => false,
  isUpdatePending: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    !!(event.body?.manifest || context.downloadedManifest),
  isUpdateAvailable: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    event.body?.manifest !== undefined || context.isUpdateAvailable,
});

const downloadErrorAction = assign({
  downloadError: (context: UpdatesStateMachineContext, event: UpdatesStateMachineEvent) =>
    new Error(event.body?.message || 'downloadError'),
  isDownloading: () => false,
});

const check = assign({
  isChecking: (context: UpdatesStateMachineContext) => true,
});

const download = assign({
  isDownloading: (context: UpdatesStateMachineContext) => true,
});

/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
export const UpdatesStateMachine = createMachine<UpdatesStateMachineContext>({
  id: 'Updates',
  initial: 'idle',
  context: {
    isChecking: false,
    isDownloading: false,
    isUpdateAvailable: false,
    isUpdatePending: false,
    isRollback: false,
  },
  predictableActionArguments: true,
  states: {
    idle: {
      on: {
        check: {
          target: 'checking',
          actions: check,
        },
        download: {
          target: 'downloading',
          actions: download,
        },
        restart: {
          target: 'restarting',
        },
      },
    },
    checking: {
      on: {
        checkCompleteAvailable: {
          target: 'idle',
          actions: [checkCompleteAvailableAction],
        },
        checkCompleteUnavailable: {
          target: 'idle',
          actions: [checkCompleteUnavailableAction],
        },
        checkError: {
          target: 'idle',
          actions: [checkErrorAction],
        },
      },
    },
    downloading: {
      on: {
        downloadComplete: {
          target: 'idle',
          actions: [downloadCompleteAction],
        },
        downloadError: {
          target: 'idle',
          actions: [downloadErrorAction],
        },
      },
    },
    restarting: {
      type: 'final',
    },
  },
});
