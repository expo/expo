import ModuleBase from './ModuleBase';
import { FirebaseModuleConfig } from '../types';
export declare const getNativeModule: (module: ModuleBase) => Object;
export declare const initialiseNativeModule: (module: ModuleBase, config: FirebaseModuleConfig, customUrlOrRegion?: string | undefined) => Object;
