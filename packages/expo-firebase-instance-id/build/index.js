import { ModuleBase } from 'expo-firebase-app';
export const MODULE_NAME = 'ExpoFirebaseInstanceID';
export const NAMESPACE = 'iid';
export const statics = {};
export default class InstanceId extends ModuleBase {
    constructor(app) {
        super(app, {
            hasCustomUrlSupport: false,
            moduleName: MODULE_NAME,
            hasMultiAppSupport: false,
            namespace: NAMESPACE,
        });
        this._validateAuthorizedEntity = (token) => {
            if (!token || token === '') {
                return this.app.options.messagingSenderId;
            }
            return token;
        };
        this._validateScope = (scope) => {
            if (!scope || scope === '') {
                return '*';
            }
            return scope;
        };
        this.getToken = async (authorizedEntity, scope) => {
            return await this.nativeModule.getToken(this._validateAuthorizedEntity(authorizedEntity), this._validateScope(scope));
        };
        this.deleteToken = async (authorizedEntity, scope) => {
            return await this.nativeModule.deleteToken(this._validateAuthorizedEntity(authorizedEntity), this._validateScope(scope));
        };
    }
    async delete() {
        return await this.nativeModule.delete();
    }
    async get() {
        return await this.nativeModule.get();
    }
}
InstanceId.moduleName = MODULE_NAME;
InstanceId.namespace = NAMESPACE;
InstanceId.statics = statics;
//# sourceMappingURL=index.js.map