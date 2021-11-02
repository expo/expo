export default [
  {
    name: 'extends',
    type: 'string',
    description: [
      'The name of the build profile that the current one should inherit values from. This value can\'t be specified per platform.',
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
      '- `internal` - with this option you\'ll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. When using `internal`, make sure the build produces an APK or IPA file. Otherwise, the sharable URL will be useless. [Learn more about internal distribution](../internal-distribution).',
      ' - `store` - produces builds for store uploads, your build URLs won\'t be sharable.'
    ]
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
      },
      {
        name: 'cacheDefaultPaths',
        type: 'boolean',
        description: [
          'Specifies whether to cache the recommended set of files, currently only Podfile.lock is cached by default for iOS build and nothing is cached for Android. Defaults to true.',
        ],
      }
    ]
  }
]
