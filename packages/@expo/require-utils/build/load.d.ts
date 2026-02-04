declare module 'node:module' {
    function _nodeModulePaths(base: string): readonly string[];
}
declare global {
    namespace NodeJS {
        interface Module {
            _compile(code: string, filename: string, format?: 'module' | 'commonjs' | 'commonjs-typescript' | 'module-typescript' | 'typescript'): unknown;
        }
    }
}
export interface ModuleOptions {
    paths?: string[];
}
declare function evalModule(code: string, filename: string, opts?: ModuleOptions): any;
declare function loadModule(filename: string): Promise<any>;
export { evalModule, loadModule };
