module.exports = {
  dependency: {
    platforms: {
      ios: {
        /**
         * We need this property to trick `react-native-cli`. Normally, this tool looks for the XCode project.
         * We can generate it using `XcodeGen` but we don't want to add the project file to this library.
         */
        project: 'ios/EXDevLauncher.xcodeproj/project.pbxproj',
      },
    },
  },
};
