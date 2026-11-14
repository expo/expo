module.exports = {
  dependency: {
    platforms: {
      android: {
        libraryName: 'exposelectabletext',
        componentDescriptors: ['ExpoSelectableTextComponentDescriptor'],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
