import { App, ModuleBase } from 'expo-firebase-app';

export const MODULE_NAME = 'ExpoFirebaseInstanceID';
export const NAMESPACE = 'iid';
export const statics = {};

export default class InstanceId extends ModuleBase {
  static moduleName = MODULE_NAME;
  static namespace = NAMESPACE;
  static statics = statics;

  constructor(app: App) {
    super(app, {
      hasCustomUrlSupport: false,
      moduleName: MODULE_NAME,
      hasMultiAppSupport: false,
      namespace: NAMESPACE,
    });
  }

  async delete(): Promise<void> {
    return await this.nativeModule.delete();
  }

  async get(): Promise<string> {
    return await this.nativeModule.get();
  }

  _validateAuthorizedEntity = (token?: string): string | undefined => {
    if (!token || token === '') {
      return this.app.options.messagingSenderId;
    }
    return token;
  };

  _validateScope = (scope?: string): string | undefined => {
    if (!scope || scope === '') {
      return '*';
    }
    return scope;
  };

  getToken = async (authorizedEntity?: string, scope?: string): Promise<string> => {
    return await this.nativeModule.getToken(
      this._validateAuthorizedEntity(authorizedEntity),
      this._validateScope(scope)
    );
  };

  deleteToken = async (authorizedEntity?: string, scope?: string): Promise<void> => {
    return await this.nativeModule.deleteToken(
      this._validateAuthorizedEntity(authorizedEntity),
      this._validateScope(scope)
    );
  };
}
