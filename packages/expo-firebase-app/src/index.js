/**
 * @flow
 */
import App from './app';
import Firebase from './firebase';
import * as events from './utils/events';
import * as utils from './utils';
import * as log from './utils/log';
import * as native from './utils/native';
import parseConfig, * as configUtils from './utils/parseConfig';
import internals from './utils/internals';
import NativeError from './NativeError';

import './utils/UtilsModule';

export { default as ModuleBase } from './utils/ModuleBase';
export { default as ReferenceBase } from './utils/ReferenceBase';
export { default as registerModule } from './utils/registerModule';
export { events, utils, log, native, internals, App, parseConfig, configUtils, NativeError };

export default Firebase;

export type { NativeErrorResponse, NativeErrorObject, NativeErrorInterface } from './types';
