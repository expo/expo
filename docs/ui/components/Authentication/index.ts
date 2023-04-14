export { Grid } from './Grid';
export { GridItem } from './GridItem';
export { Box } from './Box';

const ASSETS_PATH = '/static/images/sdk/auth-session/';

export const ASSETS = {
  apple: ASSETS_PATH + 'apple.png',
  azure: ASSETS_PATH + 'azure.png',
  beyondidentity: ASSETS_PATH + 'beyondidentity.png',
  cognito: ASSETS_PATH + 'cognito.png',
  coinbase: ASSETS_PATH + 'coinbase.png',
  id4: ASSETS_PATH + 'identity4.png',
  dropbox: ASSETS_PATH + 'dropbox.png',
  facebook: ASSETS_PATH + 'facebook.png',
  fitbit: ASSETS_PATH + 'fitbit.png',
  firebase: ASSETS_PATH + 'firebase-phone.png',
  github: ASSETS_PATH + 'github.png',
  google: ASSETS_PATH + 'google.png',
  imgur: ASSETS_PATH + 'imgur.png',
  okta: ASSETS_PATH + 'okta.png',
  reddit: ASSETS_PATH + 'reddit.png',
  slack: ASSETS_PATH + 'slack.png',
  spotify: ASSETS_PATH + 'spotify.png',
  strava: ASSETS_PATH + 'strava.png',
  twitch: ASSETS_PATH + 'twitch.png',
  twitter: ASSETS_PATH + 'twitter.png',
  uber: ASSETS_PATH + 'uber.png',
} as const;
