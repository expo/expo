export { Box } from './Box';
export { Grid } from './Grid';
export { GridItem } from './GridItem';

const ASSETS_PATH = '/static/images/sdk/auth-session/';
export const ASSETS = {
  github: ASSETS_PATH + 'github.png',
  okta: ASSETS_PATH + 'okta.png',
} as const;
