import { ResourceClasses } from '~/ui/components/utils/infrastructure';

export default [
  {
    name: 'withoutCredentials',
    type: 'boolean',
    description: [
      "When set to `true`, EAS CLI won't require you to configure credentials when building the app. This comes in handy when you want to build debug binaries and the debug keystore is checked in to the repository. Defaults to `false`.",
    ],
  },
  {
    name: 'image',
    type: 'string',
    description: [
      '[Image with build environment](/build-reference/infrastructure/).',
    ],
  },
  {
    name: 'resourceClass',
    enum: ['default', ...ResourceClasses.android],
    description: [
      `The Android-specific resource class that will be used to run this build. Defaults to \`${ResourceClasses.android[0]}\`.`,
      '',
      'For information on available build resources for each resource class, see [Android build server configurations](/build-reference/infrastructure/#android-build-server-configurations).',
      '',
      'The `large` resource class is not available on the free plan.',
    ],
  },
  {
    name: 'ndk',
    type: 'string',
    description: [ 'Version of Android NDK.' ],
  },
  {
    name: 'autoIncrement',
    type: 'boolean | \"version\" | \"versionCode\"',
    description: [
      'Controls how EAS CLI bumps your application build version. Defaults to `false`.',
      '',
      'Allowed values:',
      ' - `"version"` - bumps the patch of `expo.version` (for example, `1.2.3` to `1.2.4`).',
      ' - `"versionCode"` (or `true`) - bumps `expo.android.versionCode` (for example, `3` to `4`).',
      ' - `false` - versions won\'t be bumped automatically (default).',
      '',
      'Based on the value of [`cli.appVersionSource` in **eas.json**](/build-reference/app-versions/), the values will be updated locally in your project or on EAS servers.',
    ],
  },
  {
    name: 'buildType',
    enum: ['app-bundle', 'apk'],
    description: [
      'Type of the artifact you want to build. It controls which Gradle task will be used to build the project. It can be overridden by `gradleCommand` or `developmentClient: true` option.',
      ' - `app-bundle` - `:app:bundleRelease` (creates **.aab** artifact)',
      ' - `apk` - `:app:assembleRelease` (creates **.apk** artifact)',
    ],
  },
  {
    name: 'gradleCommand',
    type: 'string',
    description: [
      'Gradle task that will be used to build your project. For example, `:app:assembleDebug` to build a debug binary.',
      "It's not recommended unless you need to run a task that `buildType` does not support, it takes priority over [`buildType`](#buildtype) and [`developmentClient`](#developmentclient).",
    ],
  },
  {
    name: 'applicationArchivePath',
    type: 'string',
    description: [
      'Path (or pattern) where EAS Build is going to look for the application archive. EAS Build uses the `fast-glob` npm library for [pattern matching](https://github.com/mrmlnc/fast-glob#pattern-syntax). The default value is `android/app/build/outputs/**/*.{apk,aab}`.'
    ],
  },
  {
    name: 'config',
    type: 'string',
    description: [
      'Custom workflow file name that will be used to run this Android build. You can also specify this property on profile level for platform-agnostic workflows. [Learn more](/custom-builds/get-started/).',
      '',
      'Example: `"config": "production-android.yml"` will use workflow from `.eas/build/production-android.yml`.'
    ],
  },
]
