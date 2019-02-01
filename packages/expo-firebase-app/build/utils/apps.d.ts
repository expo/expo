import App from '../app';
import { FirebaseModuleAndStatics, FirebaseModuleName, FirebaseNamespace } from '../types';
declare const _default: {
    app(name?: string | undefined): App;
    apps(): App[];
    deleteApp(name: string): Promise<boolean>;
    /**
     * Web SDK initializeApp
     *
     * @param options
     * @param name
     * @return {*}
     */
    initializeApp(options: any, name: string): App;
    /**
     * Bootstraps all native app instances that were discovered on boot
     */
    initializeNativeApps(): void;
    /**
     *
     * @param namespace
     * @param statics
     * @param moduleName
     * @return {function(App=)}
     */
    moduleAndStatics<M, S>(namespace: FirebaseNamespace, statics: S, moduleName: FirebaseModuleName): FirebaseModuleAndStatics<M, S>;
};
export default _default;
