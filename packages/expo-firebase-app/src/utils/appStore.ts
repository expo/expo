// @flow

import type { App, FirebaseModule } from '../types';

export const APP_STORE: { [string]: App } = {};
export const APP_MODULES: { [string]: { [string]: FirebaseModule } } = {};
export const CUSTOM_URL_OR_REGION_NAMESPACES = {
  database: true,
  functions: true,
  storage: false, // TODO true once multi-bucket support added.
  // for flow:
  admob: false,
  analytics: false,
  auth: false,
  config: false,
  crashlytics: false,
  firestore: false,
  iid: false,
  invites: false,
  links: false,
  messaging: false,
  notifications: false,
  perf: false,
  utils: false,
};
