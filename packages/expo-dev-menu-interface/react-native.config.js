module.exports = {
  dependency: {
    platforms: {
      ios: {
        /**
         * We need this property to trick `react-native-cli`. Normally, this tool looks for the XCode project.
         * However, this package is a library so we don't have a project file.
         */
        project: 'ios/EXDevMenuInterface.xcodeproj/project.pbxproj',
      },
    },
  },
};
