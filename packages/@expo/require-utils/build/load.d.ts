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
type Format = 'commonjs' | 'module' | 'module-typescript' | 'commonjs-typescript' | 'typescript';
export interface ModuleOptions {
    paths?: string[];
}
declare function evalModule(code: string, filename: string, opts?: ModuleOptions, format?: Format): any;
declare function loadModule(filename: string): Promise<any>;
/** Require module or evaluate with TypeScript
 * NOTE: Requiring ESM has been added in all LTS versions (Node 20.19+, 22.12+, 24).
 * This already forms the minimum required Node version as of Expo SDK 54 */
declare function loadModuleSync(filename: string): any;
export { evalModule, loadModule, loadModuleSync };
