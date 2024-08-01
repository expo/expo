import { ResourceClasses } from '~/ui/components/utils/infrastructure';

export default [
  {
    name: 'withoutCredentials',
    type: 'boolean',
    description: [
      "When set to `true`, EAS CLI won't require you to configure credentials when building the app. This comes in handy when using EAS Build [custom builds](/custom-builds/get-started/). Defaults to `false`.",
    ],
  },
  {
    name: 'simulator',
    type: 'boolean',
    description: [ 'If set to true, creates build for iOS Simulator. Defaults to `false`.' ],
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
      'Controls how EAS CLI bumps your application build version. Defaults to `false`.',
      '',
      'Allowed values:',
      ' - `"version"` - bumps the patch of `expo.version` (for example, `1.2.3` to `1.2.4`).',
      ' - `"buildNumber"` (or `true`) - bumps the last component of `expo.ios.buildNumber` (for example, `1.2.3.39` to `1.2.3.40`).',
      ' - `false` - versions won\'t be bumped automatically (default)',
      '',
      'Based on the value of [`cli.appVersionSource` in **eas.json**](/build-reference/app-versions/), the values will be updated locally in your project or on EAS servers.',
    ],
  },
  {
    name: 'image',
    type: 'string',
    description: [
      '[Image with build environment](/build-reference/infrastructure).',
    ],
  },
  {
    name: 'resourceClass',
    enum: ['default', ...ResourceClasses.ios],
    description: [
      `The iOS-specific resource class that will be used to run this build. Defaults to \`${ResourceClasses.ios[0]}\`.`,
      '',
      'For information on available build resources for each resource class, see [iOS build server configurations](/build-reference/infrastructure/#ios-build-server-configurations).',
      '',
      'The `large` resource class is not available on the free plan.',
    ],
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
    name: 'scheme',
    type: 'string',
    description: [
      "Xcode project's scheme. If a project:",
      '   - Has multiple schemes, you should set this value.',
      '   - Has only one scheme, it will be detected automatically.',
      '   - Have multiple schemes schemes and if this value is **not** set, EAS CLI will prompt you to select one of them.',

    ]
  },
  {
    name: 'buildConfiguration',
    type: 'string',
    description: [
      'Xcode project\'s Build Configuration.',
      ' - For an Expo project, the value is `"Release"` or `"Debug"`. Defaults to `"Release"`.',
      ' - For a [bare React Native](/bare/overview/) project, defaults to the value specified in the scheme.',
      '',
      'It takes priority over [`developmentClient`](#developmentclient).',
    ],
  },
  {
    name: 'applicationArchivePath',
    type: 'string',
    description: [
      'Path (or pattern) where EAS Build is going to look for the application archive. EAS Build uses the `fast-glob` npm package for [pattern matching](https://github.com/mrmlnc/fast-glob#pattern-syntax). You should modify that path only if you are using a custom **Gymfile**. The default is `ios/build/Build/Products/*-iphonesimulator/*.app` when building for simulator and `ios/build/*.ipa` in other cases.'
    ],
  },
  {
    name: 'config',
    type: 'string',
    description: [
      'Custom workflow file name that will be used to run this iOS build. You can also specify this property on profile level for platform-agnostic workflows. [Learn more](/custom-builds/get-started/).',
      '',
      'Example: `"config": "production-ios.yml"` will use workflow from `.eas/build/production-ios.yml`.'
    ],
  },
]
