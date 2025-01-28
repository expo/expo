export default [
  {
    name: 'withoutCredentials',
    type: 'boolean',
    description: [
      "When set to `true`, EAS CLI won't require you to configure credentials when building the app. This comes in handy when using EAS Build [custom builds](/custom-builds/get-started/). Defaults to `false`.",
    ],
  },
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
      ' - `local` - if you want to provide your own [**credentials.json**](/app-signing/local-credentials).',
      ' - `remote` - if you want to use the credentials managed by EAS (default option).',
    ],
  },
  {
    name: 'releaseChannel',
    type: 'string',
    description: [
      '**Deprecated**: Name of the release channel for the Classic Updates service, which is only supported in SDK 49 and lower. If you do not specify a channel, your binary will pull releases from the `default` channel.',
      '',
      'EAS Update uses the [channel](#channel) field, so you can remove [`releaseChannel`](#releasechannel) after [migrating to EAS Update](/eas-update/migrate-from-classic-updates/).',
    ],
  },
  {
    name: 'channel',
    type: 'string',
    description: [
      'The EAS Update channel where this build will look for updates. [Learn more](../../eas-update/how-it-works). Standalone builds will check for and download updates matching platform, native runtime, and channel.',
      '',
      'This field has no effect when [`developmentClient`](#developmentclient) is set to `true`, as development builds can run updates from any channel.',
      '',
      'If you have not yet migrated from Classic Updates to EAS Update, then continue to use the [`releaseChannel`](#releasechannel) field instead.',
    ],
  },
  {
    name: 'distribution',
    enum: ['store', 'internal'],
    description: [
      'The method of distributing your app.',
      "- `internal` - with this option you'll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. When using `internal`, make sure the build produces a **.apk** or **ipa** file. Otherwise, the shareable URL will be not work. See [internal distribution](/build/internal-distribution) for more information.",
      " - `store` - produces builds for store uploads, your build URLs won't be shareable.",
    ],
  },
  {
    name: 'developmentClient',
    type: 'boolean',
    description: [
      'If set to `true` (defaults to `false`), this field will produce a [development build](/workflow/overview/#development-builds).',
      'For the build to be successful, the project must have [`expo-dev-client`](/versions/latest/sdk/dev-client/) installed and configured.',
      '',
      '**Note**: this field is for setting the `gradleCommand` to `:app:assembleDebug` for Android and `buildConfiguration` to `Debug` for iOS . If these fields are provided for the same build profile, will take precedence over `developmentClient`.',
    ],
  },
  {
    name: 'resourceClass',
    enum: ['default', 'medium', 'large'],
    description: [
      'The resource class that will be used to run this build.',
      'To see mapping for each platform, see [Android-specific resource class field](#resourceclass-1) and [iOS-specific resource class field](#resourceclass-2).',
      '',
      'The `large` resource class is not available on the free plan.',
    ],
  },
  {
    name: 'prebuildCommand',
    type: 'string',
    description: [
      'Optional override of the [prebuild](/more/expo-cli/#prebuild) command used by EAS.',
      '',
      'For example, you can specify `prebuild --template example-template` to use a custom template.',
      '',
      '**Note**: `--platform` and `--non-interactive` will be added automatically by the build engine, so you do not need to specify them manually.',
    ],
  },
  {
    name: 'buildArtifactPaths',
    type: 'string[]',
    description: [
      'List of paths (or patterns) where EAS Build is going to look for the build artifacts. Use `applicationArchivePath` for specifying the path for uploading the application archive. Build artifacts are uploaded even if the build fails. EAS Build uses the `fast-glob` npm library for [pattern matching](https://github.com/mrmlnc/fast-glob#pattern-syntax).',
    ],
  },
  {
    name: 'node',
    type: 'string',
    description: ['Version of Node.js used for build.'],
  },
  {
    name: 'yarn',
    type: 'string',
    description: ['Version of Yarn used for build.'],
  },
  {
    name: 'pnpm',
    type: 'string',
    description: ['Version of pnpm used for build.'],
  },
  {
    name: 'bun',
    type: 'string',
    description: ['Version of Bun used for build. You can also use a specific version. Learn [how to configure the exact version in eas.json](/guides/using-bun/#customize-bun-version-on-eas).'],
  },
  {
    name: 'expoCli',
    type: 'string',
    description: [
      '**Deprecated**: Version of [`expo-cli`](https://www.npmjs.com/package/expo-cli) used to [prebuild](/more/expo-cli/#prebuild) your app. It only affects managed projects on Expo SDK 45 and lower.',
      '',
      'For newer SDKs, EAS Build will use the versioned [Expo CLI](/more/expo-cli/). It is included with `expo` library. You can opt out of using the versioned Expo CLI by setting the `EXPO_USE_LOCAL_CLI=0` environment variable in the build profile.',
    ],
  },
  {
    name: 'env',
    type: 'object',
    description: [
      '[Environment variables](/guides/environment-variables/) that should be set during the build process. It should only be used for values that you would commit to your git repository and not for passwords or [secrets](/build-reference/variables/).',
    ],
  },
  {
    name: 'autoIncrement',
    type: 'boolean',
    description: [
      'Controls how EAS CLI bumps your application build version. Defaults to `false`.',
      '',
      'When enabled, for Android, bumps `expo.android.versionCode` (for example, `3`to `4`). For iOS, bumps the last component of `expo.ios.buildNumber` (for example, `1.2.3.39` to `1.2.3.40`).',
    ],
  },
  {
    name: 'cache',
    type: 'object',
    description: [
      "Cache configuration. This feature is intended for caching values that require a lot of computation. For example, compilation results (both final binaries and any intermediate files). However, it doesn't work well for **node_modules** because the cache is not local to the machine, so the download speed is similar to downloading from the npm registry. ",
    ],
    properties: [
      {
        name: 'disabled',
        type: 'boolean',
        description: ['Disables caching. Defaults to `false`.'],
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
          'List of the paths that will be saved after a successful build and restored at the beginning of the next one. Both absolute and relative paths are supported, where relative paths are resolved from the directory with **eas.json**.',
        ],
      },
    ],
  },
  {
    name: 'config',
    type: 'string',
    description: [
      'Custom workflow file name that will be used to run this build. You can also specify this property on platform level for platform-specific workflows. [Learn more](/custom-builds/get-started/).',
      '',
      'Example: `"config": "production.yml"` will use workflow from `.eas/build/production.yml`.'
    ],
  },
  {
    name: 'environment',
    enum: ['development', 'preview', 'production'],
    description: [
      'The environment used to apply environment variables for the build process. [Learn more](/eas/environment-variables).',
    ],
  }
];
