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
        // Android-only module the iOS mock generator can't reflect, kept here by hand.
        ExpoRouter: [
          { name: 'Material3Color', argumentsCount: 2, key: 'Material3Color' },
          { name: 'Material3DynamicColor', argumentsCount: 2, key: 'Material3DynamicColor' },
        ],
      },
    },
  },
};
