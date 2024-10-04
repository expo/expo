export default [
  {
    name: 'extends',
    type: 'string',
    description: [
      "The name of the build profile that the current one should inherit values from. This value can't be specified per platform.",
    ],
  },
  {
    name: 'credentialsSource',
    enum: ['local', 'remote'],
    description: [
      'The source of credentials used to sign the application archive.',
      ' - `local` - if you want to provide your own `credentials.json` file. ([Learn more on this here](/app-signing/local-credentials).)',
      ' - `remote` - if you want to use the credentials managed by EAS (this is the default option).',
    ],
  },
  {
    name: 'releaseChannel',
    type: 'string',
    description: [
      '**Deprecated**: Name of the release channel for the Classic Updates service, which is only supported in SDK 49 and lower. If you do not specify a channel, your binary will pull releases from the `default` channel.',
      '',
      'EAS Update uses the [channel](#channel) field, so you can remove [releaseChannel](#releasechannel) after migrating to EAS Update. [Learn more about migrating from Classic Updates to EAS Update](/eas-update/migrate-from-classic-updates/).',
    ],
  },
  {
    name: 'channel',
    type: 'string',
    description: [
      'The EAS Update channel where this build will look for updates. [Learn more](../../eas-update/how-it-works). Standalone builds will check for and download updates matching platform, native runtime, and channel.',
      '',
      'This field has no effect when [developmentClient](#developmentclient) is set to `true`, as development builds can run updates from any channnel.',
      '',
      'If you have not yet migrated from Classic Updates to EAS Update, then continue to use the [releaseChannel](#releasechannel) field instead.',
    ],
  },
  {
    name: 'distribution',
    enum: ['store', 'internal'],
    description: [
      'The method of distributing your app.',
      "- `internal` - with this option you'll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. When using `internal`, make sure the build produces an APK or IPA file. Otherwise, the shareable URL will be useless. [Learn more about internal distribution](../../build/internal-distribution).",
      " - `store` - produces builds for store uploads, your build URLs won't be shareable.",
    ],
  },
  {
    name: 'developmentClient',
    type: 'boolean',
    description: [
      'If set to true (defaults to false), this field expresses the intent to produce a development client build.',
      'For the build to be successful, the project must have expo-dev-client installed and configured.',
      'Note: this field is sugar for setting the iOS `buildConfiguration` to `Debug` and Android `gradleCommand` to `:app:assembleDebug`. Those fields, if provided for the same build profile, will take precedence.',
      '[Learn more about custom development clients](../../clients/introduction).',
    ],
  },
  {
    name: 'resourceClass',
    enum: ['default', 'medium', 'large'],
    description: [
      'The resource class that will be used to run this build.',
      'To see mapping for each platform, see [Android-specific resource class field](eas-json/#resourceclass-1) and [iOS-specific resource class field](eas-json/#resourceclass-2) documentation.',
      '',
      'The `large` resource class is not available on the free plan.',
    ],
  },
  {
    name: 'prebuildCommand',
    type: 'string',
    description: [
      'Optional override of the prebuild command used by EAS.',
      'For example, you can specify `prebuild --template example-template` to use a custom template.',
      'Note: `--platform` and `--non-interactive` will be added automatically by the build engine, so you do not need to specify them manually.',
      '[Learn more about prebuild options](../../workflow/expo-cli/#expo-prebuild).',
    ],
  },
  {
    name: 'buildArtifactPaths',
    type: 'string[]',
    description: [
      'List of paths (or patterns) where EAS Build is going to look for the build artifacts. Use `applicationArchivePath` for specifying the path for uploading the application archive. Build artifacts are uploaded even if the build fails. EAS Build uses the `fast-glob` npm package for pattern matching ([see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax)).',
    ],
  },
  {
    name: 'node',
    type: 'string',
    description: ['Version of Node.js.'],
  },
  {
    name: 'yarn',
    type: 'string',
    description: ['Version of Yarn.'],
  },
  {
    name: 'expoCli',
    type: 'string',
    description: [
      '**Deprecated**: Version of [expo-cli](https://www.npmjs.com/package/expo-cli) used to [prebuild](../../workflow/expo-cli/#expo-prebuild) your app. It only affects managed projects on Expo SDK 45 and lower. For newer SDKs, EAS Build will use the versioned Expo CLI. It comes with the `expo` package installed in your project ([learn more](/workflow/expo-cli)). You can opt out of using the versioned Expo CLI by setting the `EXPO_USE_LOCAL_CLI=0` env variable in the build profile.',
    ],
  },
  {
    name: 'env',
    type: 'object',
    description: [
      'Environment variables that should be set during the build process (should only be used for values that you would commit to your git repository, i.e. not passwords or secrets).',
    ],
  },
  {
    name: 'autoIncrement',
    type: 'boolean',
    description: [
      'Controls how EAS CLI bumps your application build version. Defaults to `false`.',
      '',
      'When enabled, for iOS, bumps the last component of `expo.ios.buildNumber` (e.g. `1.2.3.39` -> `1.2.3.40`) and for Android, bumps `expo.android.versionCode` (e.g. `3` -> `4`).',
    ],
  },
  {
    name: 'cache',
    type: 'object',
    description: [
      "Cache configuration. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn't work well for `node_modules` because the cache is not local to the machine, so the download speed is similar to downloading from the npm registry. ",
    ],
    properties: [
      {
        name: 'disabled',
        type: 'boolean',
        description: ['Disables caching. Defaults to false.'],
      },
      {
        name: 'key',
        type: 'string',
        description: ['Cache key. You can invalidate the cache by changing this value.'],
      },
      {
        name: 'paths',
        type: 'array',
        description: [
          'List of the paths that will be saved after a successful build and restored at the beginning of the next one. Both absolute and relative paths are supported, where relative paths are resolved from the directory with `eas.json`.',
        ],
      },
    ],
  },
];
