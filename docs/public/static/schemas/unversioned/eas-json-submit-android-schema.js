export default [
  {
    name: 'serviceAccountKeyPath',
    type: 'string',
    description: ['Path to the JSON file with [Google Service Account Key](https://expo.fyi/creating-google-service-account) used to authenticate with Google Play.'],
  },
  {
    name: 'track',
    enum: ['production', 'beta', 'alpha', 'internal'],
    description: ['The track of the application to use.']
  },
  {
    name: 'releaseStatus',
    enum: ['completed', 'draft', 'halted', 'inProgress'],
    description: ['The [status of a release](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks#status).'],
  },
  {
    name: 'rollout',
    type: 'number',
    description: ['The initial fraction of users who are eligible to receive the release. Should be a value from 0 (no users) to 1 (all users). Works only with `inProgress` [release status](https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks#status).'],
  },
  {
    name: 'changesNotSentForReview',
    type: 'boolean',
    description: ['Indicates that the changes sent with this submission will not be reviewed until they are explicitly sent for review from the Google Play Console UI. Defaults to `false`.'],
  },
  {
    name: 'applicationId',
    type: 'string',
    description: [
      'The application ID that is used when accessing Service Account Key managed by Expo. It does not have any effect if you are using local credentials. In most cases this value will be autodetected. However, if you have multiple product flavors, this value might be necessary.',
    ],
  },
];
