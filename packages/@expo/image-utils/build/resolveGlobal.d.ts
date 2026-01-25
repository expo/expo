declare module 'module' {
    namespace Module {
        const globalPaths: readonly string[] | void;
    }
}
/** Resolve a globally installed module before a locally installed one */
export declare const resolveGlobal: (id: string) => string;
