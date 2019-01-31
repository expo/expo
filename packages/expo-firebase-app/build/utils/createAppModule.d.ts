import { FirebaseModule } from '../types';
declare type ModuleFactory = () => FirebaseModule;
/**
 *
 * @param app
 * @param namespace
 * @param InstanceClass
 * @return {function()}
 * @private
 */
export declare const createAppModule: <M>(app: any, namespace: any, InstanceClass?: any) => ModuleFactory;
export {};
