import { createMachine, assign } from 'xstate';

interface UpdatesContext {
  latestUpdateId: number;
  downloadedUpdateId: number;
  lastError: string;
}

const newManifestOnServer = assign({
  latestUpdateId: (context: UpdatesContext) => context.latestUpdateId + 1,
});

const manifestDownloaded = assign({
  downloadedUpdateId: (context: UpdatesContext) => context.latestUpdateId,
});

const setError = (error: string) =>
  assign({
    lastError: (context: UpdatesContext) => error,
  });

/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 *
 */
const UpdatesStateMachine = createMachine<UpdatesContext>({
  id: 'Updates',
  initial: 'afterRestart',
  context: {
    latestUpdateId: 0,
    downloadedUpdateId: 0,
    lastError: '',
  },
  states: {
    afterRestart: {
      on: {
        CHECK: 'checking',
      },
    },
    checking: {
      on: {
        CHECK_COMPLETE_AVAILABLE_NEW: {
          target: 'updateAvailable',
          actions: [newManifestOnServer, setError('')],
        },
        CHECK_COMPLETE_AVAILABLE_UNCHANGED: {
          target: 'updateAvailable',
          actions: setError(''),
        },
        CHECK_COMPLETE_UNAVAILABLE: {
          target: 'updateNotAvailable',
          actions: setError(''),
        },
        CHECK_ERROR: {
          target: 'afterRestart',
          actions: setError('errorOnCheck'),
        },
      },
    },
    rechecking: {
      on: {
        RECHECK_COMPLETE_NEW: {
          target: 'updateAvailable',
          actions: [newManifestOnServer, setError('')],
        },
        RECHECK_COMPLETE_UNCHANGED: {
          target: 'updatePending',
          actions: setError(''),
        },
        RECHECK_ERROR: {
          target: 'updatePending',
          actions: setError('errorOnReheck'),
        },
      },
    },
    updateAvailable: {
      on: {
        CHECK: 'checking',
        DOWNLOAD: 'downloading',
      },
    },
    updateNotAvailable: {
      on: {
        CHECK: 'checking',
      },
    },
    downloading: {
      on: {
        DOWNLOAD_COMPLETE_NEW: {
          target: 'updatePending',
          actions: [newManifestOnServer, manifestDownloaded, setError('')],
        },
        DOWNLOAD_COMPLETE_UNCHANGED: {
          target: 'updatePending',
          actions: [manifestDownloaded, setError('')],
        },
        DOWNLOAD_ERROR: {
          target: 'updateAvailable',
          actions: setError('errorOnDownload'),
        },
      },
    },
    updatePending: {
      on: {
        RECHECK: 'rechecking',
        RELOAD: 'restarting',
      },
    },
    restarting: {
      type: 'final',
    },
  },
});

export default UpdatesStateMachine;
