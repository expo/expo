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
    enum: [ 'store', 'internal', 'simulator' ],
    description: [ 'The method of distributing your app.',
      '- `internal` - with this option you\'ll be able to share your build URLs with anyone, and they will be able to install the builds to their devices straight from the Expo website. [Learn more about internal distribution](../internal-distribution).',
      ' - `simulator` - creates build for simulator',
      ' - `store` - produces builds for store uploads, your build URLs won\'t be sharable.'
    ]
  },
  {
    name: 'enterpriseProvisioning',
    enum: [ 'universal', 'adhoc' ],
    description: [ 'Provisioning method used for `"distribution": "internal"` when you have an Apple account with Apple Developer Enterprise Program membership. You can choose if you want to use `adhoc` or `universal` provisioning. The latter is recommended as it does not require you to register each individual device. If you don\'t provide this option and you still authenticate with an enterprise team, you\'ll be prompted which provisioning method to use.',
    ]
  },
  {
    name: 'autoIncrement',
    type: 'boolean | \"version\" | \"buildNumber\"',
    description: [
      'Controls how EAS CLI bumps your application build version. Defaults to `false`',
      ' - `"version"` - the patch of `expo.version` is bumped (e.g. `1.2.3` -> `1.2.4`).',
      ' - `"buildNumber"` (or `true`) - the last component of `expo.ios.buildNumber` is bumped (e.g. `1.2.3.39` -> `1.2.3.40`).',
      ' - `false` - versions won\'t be bumped automatically',
      '',
      'In the case of a bare project, it also updates versions in native code. `expo.version` corresponds to `CFBundleShortVersionString` and `expo.ios.buildNumber` to `CFBundleVersion` in the `Info.plist`. The App Store is using those values to identify the app build, `CFBundleShortVersionString` is the version visible to users, whereas `CFBundleVersion` defines the build number. The combination of those needs to be unique, so you can bump either of them.',
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
    name: 'bundler',
    type: 'string',
    description: [ 'Version of [bundler](https://bundler.io/).' ],
  },
  {
    name: 'fastlane',
    type: 'string',
    description: [ 'Version of fastlane.' ],
  },
  {
    name: 'cocoapods',
    type: 'string',
    description: [ 'Version of CocoaPods.' ],
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
      'Cache configuration. This feature is intended for caching values that require a lot of computation, e.g. compilation results (both final binaries and any intermediate files), but it wouldn\'t work well for `node_modules` because the cache is not local to the machine, so the download speed is similar to downloading from the npm registry.'
    ],
    properties: [
      {
        name: 'disabled',
        type: 'boolean',
        description: [ 'Disables caching. Dafults to false.' ],
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
          'Specifies whether to cache the recommended set of files, currently only Podfile.lock is included in the list. Defaults to true.',
        ],
      }
    ]
  },
  {
    name: 'buildType',
    enum: ['release', 'development-client'],
    description: [
      'Type of the artifact you want to build. It controls which Xcode Build Configuration will be used, can be overridden by `schemeBuildConfiguration` option.',
      ' - `release` - `Release`',
      ' - `development-client` - `Debug`',
      '   - managed project: builds a development client',
      '   - bare project: builds a development client (if configured)',
    ],
  },
  {
    name: 'scheme',
    type: 'string',
    description: [
      'Xcode project\'s scheme.',
      ' - managed project: does not have any effect',
      ' - bare project',
      '   - If your project has multiple schemes, you should set this value.',
      '   - If the project has only one scheme, it will be detected automatically.',
      '   - If multiple schemes exist and this value is **not** set, EAS CLI will prompt you to select one of them.',

    ]
  },
  {
    name: 'schemeBuildConfiguration',
    type: 'string',
    description: [
      'Xcode project\'s Build Configuration.',
      ' - managed project: "Release" or "Debug", defaults to "Release"',
      ' - bare project: defaults to the value specified in the scheme',
      '',
      'It takes priority over `buildType`.',
    ],
  },
  {
    name: 'artifactPath',
    type: 'string',
    description: [
      'Path (or pattern) where EAS Build is going to look for the build artifacts. EAS Build uses the `fast-glob` npm package for pattern matching, ([see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax)). You should modify that path only if you are using a custom `Gymfile`. The default is `ios/build/Build/Products/*-iphonesimulator/*.app` when building for simulator and `ios/build/*.ipa` in other cases.'
    ],
  },
]
