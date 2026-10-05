import type { Diagnostic } from './codeframe';
type ModuleFormat = 'commonjs-typescript' | 'module-typescript' | 'typescript';
export declare function transpile(code: string, filename: string, format: ModuleFormat): {
    outputText: string;
    diagnostic?: Diagnostic;
} | undefined;
export {};
