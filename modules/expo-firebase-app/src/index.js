/**
 * @flow
 */
import App from './app';
import Firebase from './firebase';
import * as events from './utils/events';
import * as utils from './utils';
import * as log from './utils/log';
import * as native from './utils/native';
import parseConfig from './utils/parseConfig';
import * as configUtils from './utils/parseConfig';
import internals from './utils/internals';

import './utils/UtilsModule';

// TODO: Evan: Rethink utils

const { getLogger } = log;
const { getNativeModule } = native;

export { default as ModuleBase } from './utils/ModuleBase';
export { default as ReferenceBase } from './utils/ReferenceBase';
export { default as registerModule } from './utils/registerModule';
export { default as Base64 } from './utils/Base64';
export {
  events,
  utils,
  log,
  native,
  getLogger,
  getNativeModule,
  internals,
  App,
  parseConfig,
  configUtils,
};

export default Firebase;
