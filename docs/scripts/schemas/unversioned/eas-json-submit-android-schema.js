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
];
