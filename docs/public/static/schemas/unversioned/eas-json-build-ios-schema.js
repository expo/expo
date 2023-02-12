export default [
  {
    name: 'simulator',
    type: 'boolean',
    description: [ 'If set to true, creates build for simulator. Defaults to false' ],
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
      ' - `"version"` - bumps the patch of `expo.version` (e.g. `1.2.3` -> `1.2.4`).',
      ' - `"buildNumber"` (or `true`) - bumps the last component of `expo.ios.buildNumber` (e.g. `1.2.3.39` -> `1.2.3.40`).',
      ' - `false` - versions won\'t be bumped automatically (default)',
      '',
      `Based on the value of "cli.appVersionSource" option in **eas.json**, the values will be updated locally in your project or on EAS servers. [Learn more](../build-reference/app-versions)`,
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
    name: 'resourceClass',
    enum: ['default', 'medium', 'm1-medium', 'intel-medium'],
    description: [
      'The iOS-specific resource class that will be used to run this build. [Learn more](../../build-reference/infrastructure#ios-build-server-configurations)',
      '- `default` maps to `intel-medium`',
      '- `medium` maps to `intel-medium`',
      '',
      'This can change over time. To ensure you stay on the same configuration even when we change our defaults, use the specific resource class name.',
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
      'Xcode project\'s scheme.',
      ' - managed project: does not have any effect',
      ' - bare project',
      '   - If your project has multiple schemes, you should set this value.',
      '   - If the project has only one scheme, it will be detected automatically.',
      '   - If multiple schemes exist and this value is **not** set, EAS CLI will prompt you to select one of them.',

    ]
  },
  {
    name: 'buildConfiguration',
    type: 'string',
    description: [
      'Xcode project\'s Build Configuration.',
      ' - managed project: "Release" or "Debug", defaults to "Release"',
      ' - bare project: defaults to the value specified in the scheme',
      '',
      'It takes priority over `developmentClient` field.',
    ],
  },
  {
    name: 'applicationArchivePath',
    type: 'string',
    description: [
      'Path (or pattern) where EAS Build is going to look for the application archive. EAS Build uses the `fast-glob` npm package for pattern matching ([see their README to learn more about the syntax you can use](https://github.com/mrmlnc/fast-glob#pattern-syntax)). You should modify that path only if you are using a custom `Gymfile`. The default is `ios/build/Build/Products/*-iphonesimulator/*.app` when building for simulator and `ios/build/*.ipa` in other cases.'
    ],
  },
]
