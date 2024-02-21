export default [
  {
    name: 'appleId',
    type: 'string',
    description: ['Your Apple ID username (you can also set the `EXPO_APPLE_ID` env variable).'],
  },
  {
    name: 'ascAppId',
    type: 'string',
    description: [
      '[App Store Connect unique application Apple ID number](https://expo.fyi/asc-app-id). When set, results in skipping the app creation step.',
    ],
  },
  {
    name: 'appleTeamId',
    type: 'string',
    description: ['Your Apple Developer Team ID.'],
  },
  {
    name: 'sku',
    type: 'string',
    description: [
      'An unique ID for your app that is not visible on the App Store, will be generated unless provided.',
    ],
  },
  {
    name: 'language',
    type: 'string',
    description: ['Primary language. Defaults to "en-US".'],
  },
  {
    name: 'companyName',
    type: 'string',
    description: [
      'The name of your company, needed only for the first submission of any app to the App Store.',
    ],
  },
  {
    name: 'appName',
    type: 'string',
    description: [
      'The name of your app as it will appear on the App Store. Defaults to `expo.name` from the [app config](/workflow/configuration/).',
    ],
  },
  {
    name: 'ascApiKeyPath',
    type: 'string',
    description: [
      'The path to your [App Store Connect Api Key **.p8** file](https://expo.fyi/creating-asc-api-key).',
    ],
  },
  {
    name: 'ascApiKeyIssuerId',
    type: 'string',
    description: [
      'The Issuer ID of your [App Store Connect Api Key](https://expo.fyi/creating-asc-api-key).',
    ],
  },
  {
    name: 'ascApiKeyId',
    type: 'string',
    description: [
      'The Key ID of your [App Store Connect Api Key](https://expo.fyi/creating-asc-api-key).',
    ],
  },
  {
    name: 'bundleIdentifier',
    type: 'string',
    description: [
      'The bundle identifier that will be used when accessing submit credentials managed by Expo. It does not have any effect if you are using local credentials. In most cases, this value will be autodetected. However, if you have multiple Xcode schemes and targets, this value might be necessary.',
    ],
  },
  {
    name: 'metadataPath',
    type: 'string',
    description: [
      'The path to your [store configuration file](/eas/metadata/).'
    ],
  }
];
