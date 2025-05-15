module.exports = {
  DevLoadingView: {
    getConstants: { type: 'function' },
    addListener: { type: 'function', functionType: 'async' },
    removeListeners: { type: 'function', functionType: 'async' },
  },
  NativeUnimoduleProxy: {
    callMethod: { type: 'function', functionType: 'promise' },
    exportedMethods: {
      type: 'object',
      mock: {
        ExponentGLObjectManager: [
          { name: 'createContextAsync', argumentsCount: 0, key: 0 },
          { name: 'destroyContextAsync', argumentsCount: 1, key: 1 },
          { name: 'destroyObjectAsync', argumentsCount: 1, key: 2 },
          { name: 'createCameraTextureAsync', argumentsCount: 2, key: 3 },
          { name: 'takeSnapshotAsync', argumentsCount: 2, key: 4 },
        ],
        ExpoSplashScreen: [
          { name: 'hide', argumentsCount: 0, key: 'hide' },
          { name: 'hideAsync', argumentsCount: 0, key: 'hideAsync' },
          { name: 'internalMaybeHideAsync', argumentsCount: 0, key: 'internalMaybeHideAsync' },
          {
            name: 'internalPreventAutoHideAsync',
            argumentsCount: 0,
            key: 'internalPreventAutoHideAsync',
          },
          { name: 'preventAutoHideAsync', argumentsCount: 0, key: 'preventAutoHideAsync' },
          { name: 'setOptions', argumentsCount: 1, key: 'setOptions' },
        ],
      },
    },
  },
};
