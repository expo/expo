/**
 * @flow
 * Instance ID representation wrapper
 */

import { ModuleBase, getNativeModule, registerModule } from 'expo-firebase-app';
import type { App } from 'expo-firebase-app';

export const MODULE_NAME = 'ExpoFirebaseInstanceID';
export const NAMESPACE = 'iid';
export const statics = {};

export default class InstanceId extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  constructor(app: App) {
    super(app, {
      hasShards: false,
      moduleName: MODULE_NAME,
      multiApp: false,
      namespace: NAMESPACE,
    });
  }

  delete(): Promise<void> {
    return getNativeModule(this).delete();
  }

  get(): Promise<string> {
    return getNativeModule(this).get();
  }

  _validateAuthorizedEntity = (token: ?string): ?string => {
    if (!token || token === '') {
      return this.app.options.messagingSenderId;
    }
    return token;
  };

  _validateScope = (scope: ?string): ?string => {
    if (!scope || scope === '') {
      return '*';
    }
    return scope;
  };

  getToken = (authorizedEntity?: string, scope?: string): Promise<string> => {
    return getNativeModule(this).getToken(
      this._validateAuthorizedEntity(authorizedEntity),
      this._validateScope(scope)
    );
  };

  deleteToken = (authorizedEntity?: string, scope?: string): Promise<void> => {
    return getNativeModule(this).deleteToken(
      this._validateAuthorizedEntity(authorizedEntity),
      this._validateScope(scope)
    );
  };
}

registerModule(InstanceId);
