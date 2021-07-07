export default [
  {
    name: 'extends',
    type: 'string',
    description: [
      'The name of the build profile that the current one should inherit values from.'
    ],
  },
  {
    name: 'credentialsSource',
    enum: ['local', 'remote'],
    description: [
      'The source of credentials used to sign build artifacts.',
      ' - `local` - if you want to provide your own `credentials.json` file. ([learn more on this here](/app-signing/local-credentials)).',
      ' - `remote` - if you want to use the credentials managed by EAS (this is the default option).'
    ],
  },
  {
    name: 'releaseChannel',
    type: 'string',
    description: [
      'Name of the release channel for the `expo-updates` package ([Learn more about this](../../distribution/release-channels)). If you do not specify a channel, your binary will pull releases from the `default` channel. If you do not use `expo-updates` in your project then this property will have no effect.',
    ]
  },
  {
    name: 'distribution',
    enum: [ 'store', 'internal' ],
    description: [ 'The method of distributing your app.',
      '- `internal` - with this option you\'ll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. When using `internal`, make sure the build produces an APK file (e.g. `gradleCommand: ":app:assembleRelease"` or `buildType: "apk"` or `"buildType": "development-client"` ). Otherwise, the sharable URL will be useless. [Learn more about internal distribution](../internal-distribution).',
      ' - `store` - produces builds for store uploads, your build URLs won\'t be sharable.'
    ]
  },
  {
    name: 'withoutCredentials',
    type: 'boolean',
    description: [
      "When set to `true`, EAS CLI won't require you to configure credentials when building the app. This comes in handy when you want to build debug binaries and the debug keystore is checked in to the repository. The default is `false`.",
    ],
  },

  {
    name: 'image',
    type: 'string',
    description: [
      'Image with build environment. [Learn more about it here](../../build-reference/infrastructure).',
    ],
  },
  {
    name: 'node',
    type: 'string',
    description: [ 'Version of Node.js.' ],
  },
  {
    name: 'yarn',
    type: 'string',
    description: [ 'Version of Yarn.' ],
  },
  {
    name: 'ndk',
    type: 'string',
    description: [ 'Version of Android NDK.' ],
  },
  {
    name: 'expoCli',
    type: 'string',
    description: [
      'Version of [expo-cli](https://www.npmjs.com/package/expo-cli) used to [prebuild](../../workflow/expo-cli/#expo-prebuild) your app. It does not have any effect on bare projects.',
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
    name: 'cache',
    type: 'object',
    description: [
      'Cache configuration. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn\'t work well for `node_modules` because the cache is not local to the machine, so the download speed is similar to downloading from the npm registry. '
    ],
    properties: [
      {
        name: 'disabled',
        type: 'boolean',
        description: [ 'Disables caching. Defaults to false.' ],
      },
      {
        name: 'key',
        type: 'string',
        description: [ 'Cache key. You can invalidate the cache by changing this value.' ],
      },
      {
        name: 'customPaths',
        type: 'array',
        description: [
          'List of the paths that will be saved after a successful build and restored at the beginning of the next one. Both absolute and relative paths are supported, where relative paths are resolved from the directory with `eas.json`.',
        ]
      }
    ]
  },
  {
    name: 'buildType',
    enum: ['app-bundle', 'apk', 'development-client'],
    description: [
      'Type of the artifact you want to build. It controls what Gradle task will be used, can be overridden by `gradleCommand` option.',
      ' - `app-bundle` - `:app:bundleRelease`',
      ' - `apk` - `:app:assembleRelease`',
      ' - `development-client` - `:app:assembleDebug`',
      '   - managed project: builds a development client',
      '   - bare project: builds a development client (if configured)',
    ],
  },
  {
    name: 'gradleCommand',
    type: 'string',
    description: [
      'Gradle task that will be used to build your project, e.g. `:app:assembleDebug` to build a debug binary.',
      "It's not recommended unless you need to run a task that `buildType` does not support, it takes priority over `buildType`.",
    ],
  },
  {
    name: 'artifactPath',
    type: 'string',
    description: [
      'Path (or pattern) where EAS Build is going to look for the build artifacts. EAS Build uses the `fast-glob` npm package for pattern matching ([see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax)). The default value is `android/app/build/outputs/**/*.{apk,aab}`.'
    ],
  },
]
