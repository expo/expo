import invariant from 'invariant';
import { initialiseLogger, getLogger } from './log';
import { initialiseNativeModule, getNativeModule } from './native';
export default class ModuleBase {
    /**
     *
     * @param app
     * @param config
     */
    constructor(app, config, customUrlOrRegion) {
        invariant(config.moduleName, 'Error: expo-firebase-app: ModuleBase() Missing module name');
        invariant(config.namespace, 'Error: expo-firebase-app: ModuleBase() Missing namespace');
        const { moduleName } = config;
        this._app = app;
        this._customUrlOrRegion = customUrlOrRegion;
        this.namespace = config.namespace;
        this.getAppEventName = this.getAppEventName.bind(this);
        // check if native module exists as all native
        initialiseNativeModule(this, config, customUrlOrRegion);
        initialiseLogger(this, `${app.name}:${moduleName.replace('ExpoFirebase', '')}`);
    }
    getAppEventName(eventName) {
        invariant(eventName, 'Error: expo-firebase-app: ModuleBase.getAppEventName() requires a valid eventName');
        return `${this.app.name}-${eventName}`;
    }
    /**
     * Returns the App instance for current module
     * @return {*}
     */
    get app() {
        return this._app;
    }
    get nativeModule() {
        return getNativeModule(this);
    }
    get logger() {
        return getLogger(this);
    }
}
//# sourceMappingURL=ModuleBase.js.map