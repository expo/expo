export default [
  {
    name: 'serviceAccountKeyPath',
    type: 'string',
    description: ['Path to the JSON file with service account key used to authenticate with Google Play. [See how to create one](https://expo.fyi/creating-google-service-account).'],
  },
  {
    name: 'track',
    enum: ['production', 'beta', 'alpha', 'internal'],
    description: ['The track of the application to use.']
  },
  {
    name: 'releaseStatus',
    enum: ['completed', 'draft', 'halted', 'inProgress'],
    description: ['The status of a release. [Learn more](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks).'],
  },
  {
    name: 'changesNotSentForReview',
    type: 'boolean',
    description: ['Indicates that the changes sent with this submission will not be reviewed until they are explicitly sent for review from the Google Play Console UI. Defaults to false.'],
  },
  {
    name: 'applicationId',
    type: 'string',
    description: [
      'The application id that will be used when accessing Service Account Keys managed by Expo, it does not have any effect if you are using local credentials. In most cases this value will be autodetected, but if you have multiple product flavors, this value might be necessary.',
    ],
  },
];
