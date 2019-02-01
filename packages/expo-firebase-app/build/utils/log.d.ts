import ModuleBase from './ModuleBase';
export declare const getLogger: (module: ModuleBase) => Object;
export declare const LEVELS: {
    debug: number;
    info: number;
    warn: number;
    error: number;
};
export declare const initialiseLogger: (module: ModuleBase, logNamespace: string) => void;
