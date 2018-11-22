/**
 * @flow
 */
import Firebase from './firebase';
import * as utils from './utils';
import parseConfig, * as configUtils from './utils/parseConfig';

export { default as UtilsModule } from './utils/UtilsModule';
export { default as App } from './app';
export { default as ModuleBase } from './utils/ModuleBase';
export { default as ReferenceBase } from './utils/ReferenceBase';
export { default as SharedEventEmitter } from './utils/SharedEventEmitter';
export { default as NativeError } from './NativeError';
export { default as INTERNALS } from './utils/internals';

export { utils, parseConfig, configUtils };

export type { NativeErrorResponse, NativeErrorObject, NativeErrorInterface } from './types';

export default Firebase;
