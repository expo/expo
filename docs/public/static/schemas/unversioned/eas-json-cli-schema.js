export default [
  {
    name: 'version',
    type: 'string',
    description: [
      'A [semantic version range](https://github.com/npm/node-semver#ranges) of EAS CLI versions that the project supports, such as `>= 16.0.0`. If the installed EAS CLI version is outside this range, EAS CLI stops with an error. The check is skipped when `EAS_SKIP_CLI_VERSION_CHECK` is set.',
    ],
  },
  {
    name: 'requireCommit',
    type: 'boolean',
    description: [
      'If `true`, `eas build` and `eas update` require a clean Git working tree. If EAS CLI finds uncommitted changes, it asks whether to commit them. In non-interactive mode, it stops instead. For a build, EAS CLI then uploads a shallow Git clone of your last commit. For more information, see [Full Git workflow](/build-reference/project-upload/#full-git-workflow). Defaults to `false`.',
    ],
  },
  {
    name: 'appVersionSource',
    enum: ['local', 'remote'],
    description: [
      "The source of your app's developer-facing build version (`android.versionCode` and `ios.buildNumber`). With `remote`, Expo servers store and manage the version. With `local`, Expo Build reads the version from your project files. If you omit this field, EAS CLI warns that it will be required in the future and uses local. When a build profile sets autoIncrement to true, EAS CLI asks you to choose a source and saves it to **eas.json**. For more information, see [App version management](/build-reference/app-versions/).",
    ],
  },
  {
    name: 'promptToConfigurePushNotifications',
    type: 'boolean',
    description: [
      'If `false`, EAS CLI does not ask whether to set up push notification credentials when it sets up iOS credentials for a build. If you omit this field, EAS CLI asks only when the `dependencies` in your **package.json** include `expo-notifications`.',
    ],
  },
];
