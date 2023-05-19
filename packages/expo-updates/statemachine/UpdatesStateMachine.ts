import { createMachine, assign } from 'xstate';

interface UpdatesContext {
  updateId: number;
}

/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
const UpdatesStateMachine = createMachine<UpdatesContext>({
  id: 'Updates',
  initial: 'afterRestart',
  context: {
    updateId: 0,
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
          actions: assign({
            updateId: (context: UpdatesContext) => context.updateId + 1,
          }),
        },
        CHECK_COMPLETE_AVAILABLE_UNCHANGED: {
          target: 'updateAvailable',
        },
        CHECK_COMPLETE_UNAVAILABLE: {
          target: 'updateNotAvailable',
        },
        CHECK_ERROR: {
          target: 'errorOnCheck',
        },
      },
    },
    rechecking: {
      on: {
        RECHECK_COMPLETE_NEW: {
          target: 'updateAvailable',
          actions: assign({
            updateId: (context: UpdatesContext) => context.updateId + 1,
          }),
        },
        RECHECK_COMPLETE_UNCHANGED: {
          target: 'updatePending',
        },
        RECHECK_ERROR: {
          target: 'errorOnRecheck',
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
          actions: assign({
            updateId: (context: UpdatesContext) => context.updateId + 1,
          }),
        },
        DOWNLOAD_COMPLETE_UNCHANGED: {
          target: 'updatePending',
        },
        DOWNLOAD_ERROR: {
          target: 'errorOnDownload',
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
    errorOnCheck: {
      on: {
        DISMISS: {
          target: 'afterRestart',
        },
      },
    },
    errorOnRecheck: {
      on: {
        DISMISS: {
          target: 'updatePending',
        },
      },
    },
    errorOnDownload: {
      on: {
        DISMISS: {
          target: 'updateAvailable',
        },
      },
    },
  },
});

export default UpdatesStateMachine;
