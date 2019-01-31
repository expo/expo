import ModuleBase from './ModuleBase';
import { FirebaseModuleConfig } from '../types';
export declare const getAppEventName: (module: ModuleBase, eventName: string) => string;
export declare const initialiseNativeModuleEventEmitter: (module: ModuleBase, config: FirebaseModuleConfig) => void;
