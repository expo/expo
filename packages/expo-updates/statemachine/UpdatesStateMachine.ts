import { createMachine, assign } from 'xstate';

interface UpdatesContext {
  isUpdateAvailable: boolean;
  isUpdatePending: boolean;
  latestUpdateId?: number;
  isChecking: boolean;
  isDownloading: boolean;
  downloadedUpdateId?: number;
  checkError?: Error;
  downloadError?: Error;
}

const newManifestOnServer = assign({
  latestUpdateId: (context: UpdatesContext) => (context?.latestUpdateId || 0) + 1,
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
  downloadedUpdateId: (context: UpdatesContext) => context?.latestUpdateId || 0,
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

const setIsChecking = (isChecking: boolean) =>
  assign({
    isChecking: (context: UpdatesContext) => isChecking,
  });

const setIsDownloading = (isDownloading: boolean) =>
  assign({
    isDownloading: (context: UpdatesContext) => isDownloading,
  });

/**
 * Model of the expo-updates state machine, written in Typescript.
 * The actual implementations of this state machine will be in Swift on iOS and Kotlin on Android.
 */
const UpdatesStateMachine = createMachine<UpdatesContext>({
  /** @xstate-layout N4IgpgJg5mDOIC5QFUAOECGAXOA6AlhADZgDEAwgBICi5A0gNoAMAuoqKgPaz5b6cA7diAAeiAKxMAbLgBMARgAcAdnEBmKWtnj5ATjUAaEAE8Ju5bnHLFTACzLl8tePWyAvm6NpMOWAWJkACIA8gDqAHIAMsEAgoHMbEggXDx8gsJiCLZSurhSKjpM4lK2iuKKUlJGpgg5apZq8vKOTPq2tsUeXujYeIQkpABK1ADKACoxg2MJwim8-EJJmcrOuLr5ylKyW0WyiorViFLNuDbZ8jm6skXiul0g3r1+AMYAFmDPANb4AlAUNPQAPrkYIAWQACpFqGNqICYgA1GIASUiMQAQlDAeFqKEZkk5mlFqBMrJZLZLPpNvYyo1pIcEIp5LhbLpWbobGUpKp3J4Hj1fLg3h9vr9-rQ6MCwZDobCEcjURjYchwlQYuEAOLUeKsWbcebpJaIUnk25qKnWdTyOkmI1qJi4ZyU7T7cou+6PAVCr4-P5UcWSiFQmGA5VylHoqF4jh6wkZI1kilmkoW2lVG0IZyyXCbFzmTRMMkaNTu-l4L0i30AiXUQaDYKDKPJGMLOMIY2J800q1pmr2cS4ZpKUlcpTs9olnx4CCcADuAiInAwEB9pBCEWicQD0uD2NxOvxzYNxPjJspya71pq1lypVssl07RWajNd15Hqns-ni+XorXUVigRbkGSoqpQaqatqiTRqkLaGm2Camp2lqXog6zkso6wONIag2PItgTk8uDTnOC5Liuf4boBNZ1g2+7QfqRKiCeHbnshPaIE0Th5MUeE6LYrSyKoHi8gInAQHAwjvvAB4wUeTEIAAtOxikyEwanqRpGnKARAr9GAuqyYxmRSDoawbFshZ4WS9LHIoDp2FIRR2AojKKDpZbvN6vwGQxrY5HITCNLIzjlMognWPSeHkoo2TOGUFyOYoVzuX4xFfmR3kyb5cF3vSYUyDYDi0jhFTZCluAAE5wFgGAVXwmX0bGcEVDII77JsORMBUug2ScRTZKUCh2pUr4eEAA */
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
          actions: setIsChecking(true),
        },
        DOWNLOAD: {
          target: 'downloading',
          actions: setIsDownloading(true),
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

export default UpdatesStateMachine;
