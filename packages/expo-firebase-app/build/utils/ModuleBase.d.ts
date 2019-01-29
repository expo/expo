import App from '../app';
import { FirebaseModuleConfig, FirebaseNamespace } from '../types';
export default class ModuleBase {
    _app: App;
    _customUrlOrRegion?: string;
    namespace: FirebaseNamespace;
    /**
     *
     * @param app
     * @param config
     */
    constructor(app: App, config: FirebaseModuleConfig, customUrlOrRegion?: string);
    getAppEventName(eventName?: string): string;
    /**
     * Returns the App instance for current module
     * @return {*}
     */
    readonly app: App;
    readonly nativeModule: any;
    readonly logger: any;
}
